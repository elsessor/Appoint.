import { LoaderIcon } from "lucide-react";

function ChatLoader() {
    return (
        <div className="h-screen flex items-center justify-center p-4">
        <LoaderIcon className="animate-spin size-10 text-primary" />
        <p className="mt-4 text-lg text-lg font-mono">Loading chat...</p>
        </div>
    );
}
export default ChatLoader;