import type { DishOption } from "../types/__generated__/graphql.ts";

interface IDishProps {
    id?: number;
    description: string;
    name: string;
    price: number;
    isCustormer?: boolean;
    orderStarted?: boolean;
    isSelected?: boolean;
    options?: DishOption[] | null;
    addItemToOrder?: (dishId: number) => void;
    removeFromOrder?: (dishId: number) => void;
}

function Dish({
    id = 0,
    description,
    name,
    price,
    isCustormer = false,
    orderStarted = false,
    options,
    isSelected,
    addItemToOrder,
    removeFromOrder,
    children: dishOptions, // change the name
}: IDishProps & { children?: React.ReactNode }) {
    function onClick() {
        if (orderStarted) {
            if (!isSelected && addItemToOrder) {
                return addItemToOrder(id);
            }
        }
        if (isSelected && removeFromOrder) {
            return removeFromOrder(id);
        }
    }

    return (
        <div
            className={`px-8 py-4 border-2 border-gray-400 cursor-pointer transition-all ${
                isSelected ? "border-red-800" : "hover:border-green-800"
            }`}
        >
            <div className="mb-5">
                <h3 className="text-lg font-medium flex items-center">
                    {name}{" "}
                    {orderStarted && (
                        <button
                            className={`ml-3 py-1 px-3 focus:outline-none text-sm text-white ${
                                isSelected ? "bg-red-500" : "bg-lime-600"
                            }`}
                            onClick={onClick}
                        >
                            {isSelected ? "Remove" : "Add"}
                        </button>
                    )}
                </h3>
                <h4 className="font-medium">{description}</h4>
            </div>
            <span>${price}</span>
            {isCustormer && options && options?.length !== 0 && (
                <div>
                    <h5 className="mt-8 mb-3 font-medium">Dish Options:</h5>
                    <div>{dishOptions}</div>
                </div>
            )}
        </div>
    );
}
export default Dish;
