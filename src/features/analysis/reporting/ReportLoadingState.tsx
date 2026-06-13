type ReportLoadingStateProps = {
    message: string;
    maxWidth?: string;
};

export function ReportLoadingState({
    message,
    maxWidth = "max-w-4xl",
}: ReportLoadingStateProps) {
    return (
        <div className={`container mx-auto ${maxWidth} px-4 py-32 flex justify-center items-center text-center`}>
            <div className="animate-pulse flex flex-col items-center gap-4 text-foreground">
                <div className="h-12 w-12 rounded-full border-4 border-foreground border-t-transparent animate-spin"></div>
                <p className="font-bold">{message}</p>
            </div>
        </div>
    );
}
