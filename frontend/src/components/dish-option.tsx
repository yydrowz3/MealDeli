interface IDishOptionProps {
    isSelected: boolean;
    name: string;
    extra?: number | null;
    dishId: number;
    addOptionToItem: (dishId: number, optionName: string) => void;
    removeOptionFromItem: (dishId: number, optionName: string) => void;
}

function DishOption({
    isSelected,
    name,
    extra,
    addOptionToItem,
    removeOptionFromItem,
    dishId,
}: IDishOptionProps) {
    function onClick() {
        console.log("clicked");
        if (isSelected) {
            removeOptionFromItem(dishId, name);
        } else {
            addOptionToItem(dishId, name);
        }
    }

    return (
        <span
            onClick={onClick}
            className={`border px-2 py-1 border-gray-200 cursor-pointer ${
                isSelected ? "border-gray-800" : "hover:border-gray-800"
            }`}
        >
            <span className="mr-2">{name}</span>
            {<span className="text-sm opacity-75">(${extra})</span>}
        </span>
    );
}
export default DishOption;
