import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { getRequestUser } from "@/lib/auth-server";
import { logger } from "@/lib/logger";
import {
    getWaitlistAdminSummary,
    getWaitlistUsersByIds,
    listWaitlistUsers,
    updateWaitlistUserStatus,
    updateWaitlistUsersStatusBulk,
    createWaitlistEmailEvent,
} from "@/lib/repositories/waitlist-repository";
import type { WaitlistStatus } from "@/types";
import { sendWaitlistInviteEmail } from "@/lib/services/waitlist-email-service";

const waitlistStatuses: WaitlistStatus[] = [
    "waitlisted",
    "invited",
    "claimed",
    "activated",
    "converted",
    "inactive",
];

async function assertAdmin(req: NextRequest) {
    const user = await getRequestUser(req);

    if (!user?.email) {
        return { ok: false as const, response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
    }

    if (!isAllowedAdminEmail(user.email)) {
        return { ok: false as const, response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) };
    }

    return { ok: true as const };
}

export async function GET(req: NextRequest) {
    try {
        const auth = await assertAdmin(req);
        if (!auth.ok) {
            return auth.response;
        }

        const status = req.nextUrl.searchParams.get("status");
        const goal = req.nextUrl.searchParams.get("goal");
        const room = req.nextUrl.searchParams.get("room");
        const feedback = req.nextUrl.searchParams.get("feedback");
        const search = req.nextUrl.searchParams.get("search");
        const sort = req.nextUrl.searchParams.get("sort");

        const [users, summary] = await Promise.all([
            listWaitlistUsers({ status, goal, room, feedback, search, sort }),
            getWaitlistAdminSummary(),
        ]);

        return NextResponse.json({ success: true, data: { users, summary } });
    } catch (error) {
        logger.error("Admin waitlist route error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await assertAdmin(req);
        if (!auth.ok) {
            return auth.response;
        }

        const body = await req.json().catch(() => ({})) as {
            action?: "bulk_status" | "send_invite";
            ids?: string[];
            status?: WaitlistStatus;
        };

        const ids = Array.from(new Set((body.ids ?? []).filter((value): value is string => typeof value === "string" && value.trim().length > 0)));
        if (ids.length === 0) {
            return NextResponse.json({ success: false, error: "Select at least one waitlist user." }, { status: 400 });
        }

        if (body.action === "bulk_status") {
            if (!body.status || !waitlistStatuses.includes(body.status)) {
                return NextResponse.json({ success: false, error: "Invalid bulk status update." }, { status: 400 });
            }

            const users = await updateWaitlistUsersStatusBulk({
                ids,
                status: body.status,
            });

            return NextResponse.json({
                success: true,
                data: {
                    users,
                    summary: {
                        attempted: ids.length,
                        updated: users.length,
                        status: body.status,
                    },
                },
            });
        }

        if (body.action === "send_invite") {
            const users = await getWaitlistUsersByIds(ids);
            if (users.length === 0) {
                return NextResponse.json({ success: false, error: "No waitlist users found for invite." }, { status: 404 });
            }

            const invitedIds: string[] = [];
            const failures: Array<{ id: string; email: string; reason: string }> = [];

            for (const user of users) {
                const emailResult = await sendWaitlistInviteEmail({
                    email: user.email,
                    waitlistUserId: user.id,
                });

                await createWaitlistEmailEvent({
                    waitlistUserId: user.id,
                    email: user.email,
                    emailType: "waitlist_invite",
                    provider: emailResult.provider,
                    providerMessageId: emailResult.sent ? emailResult.providerMessageId : null,
                    status: emailResult.sent ? "sent" : "failed",
                    errorMessage: emailResult.sent ? null : emailResult.reason,
                    sentAt: emailResult.sent ? emailResult.sentAt : null,
                    metadata: {
                        source: "admin_waitlist",
                    },
                });

                if (emailResult.sent) {
                    invitedIds.push(user.id);
                } else {
                    failures.push({
                        id: user.id,
                        email: user.email,
                        reason: emailResult.reason,
                    });
                }
            }

            const updatedUsers = invitedIds.length > 0
                ? await updateWaitlistUsersStatusBulk({
                    ids: invitedIds,
                    status: "invited",
                })
                : [];

            return NextResponse.json({
                success: true,
                data: {
                    users: updatedUsers,
                    summary: {
                        attempted: ids.length,
                        sent: invitedIds.length,
                        failed: failures.length,
                    },
                    failures,
                },
            });
        }

        return NextResponse.json({ success: false, error: "Unsupported waitlist admin action." }, { status: 400 });
    } catch (error) {
        logger.error("Admin waitlist action error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const auth = await assertAdmin(req);
        if (!auth.ok) {
            return auth.response;
        }

        const body = await req.json().catch(() => ({})) as { id?: string; status?: WaitlistStatus };
        if (!body.id || !body.status || !waitlistStatuses.includes(body.status)) {
            return NextResponse.json({ success: false, error: "Invalid waitlist update payload" }, { status: 400 });
        }

        const updatedUser = await updateWaitlistUserStatus({
            id: body.id,
            status: body.status,
        });

        if (!updatedUser) {
            return NextResponse.json({ success: false, error: "Unable to update waitlist user" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: { user: updatedUser } });
    } catch (error) {
        logger.error("Admin waitlist update error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
