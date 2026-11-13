interface IButtonProps {
    canClick: boolean;
    loading: boolean;
    actionText: string;
}

function Button({ canClick, loading, actionText }: IButtonProps) {
    return (
        <button
            role="button"
            type="submit"
            className={`text-lg font-medium focus:outline-none text-white py-4  transition-colors ${
                canClick
                    ? "bg-cyan-600 hover:bg-cyan-700"
                    : "bg-gray-300 pointer-events-none"
            }`}
        >
            {loading ? "Loading..." : actionText}
        </button>
    );
}
export default Button;
