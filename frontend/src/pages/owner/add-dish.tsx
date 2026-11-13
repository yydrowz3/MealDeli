import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import {
    DISH_FRAGMENT,
    ORDERS_FRAGMENT,
    RESTAURANT_FRAGMENT,
} from "../../fragments.ts";
import type {
    CreateDishMutation,
    CreateDishMutationVariables,
} from "../../types/__generated__/graphql.ts";
import Button from "../../components/button.tsx";

const CREATE_DISH_MUTATION = gql`
    mutation createDish($input: CreateDishInput!) {
        createDish(input: $input) {
            ok
            error
        }
    }
`;

const MY_RESTAURANT_QUERY = gql`
    query myRestaurant($input: MyRestaurantInput!) {
        myRestaurant(input: $input) {
            ok
            error
            restaurant {
                ...RestaurantParts
                menu {
                    ...DishParts
                }
                orders {
                    ...OrderParts
                }
            }
        }
    }
    ${RESTAURANT_FRAGMENT}
    ${DISH_FRAGMENT}
    ${ORDERS_FRAGMENT}
`;

interface IForm {
    name: string;
    price: string;
    description: string;
    [key: string]: string;
}

function AddDish() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const [createDishMutation, { loading }] = useMutation<
        CreateDishMutation,
        CreateDishMutationVariables
    >(CREATE_DISH_MUTATION, {
        refetchQueries: [
            {
                query: MY_RESTAURANT_QUERY,
                variables: {
                    input: {
                        id: Number(restaurantId),
                    },
                },
            },
        ],
    });
    const [optionsNumber, setOptionsNumber] = useState<number[]>([]);
    const { register, handleSubmit, formState, getValues, setValue } =
        useForm<IForm>();

    function onAddOptionClick() {
        setOptionsNumber((current) => [Date.now(), ...current]); // date as an increment
    }

    function onRemoveOptionClick(idToDelete: number) {
        setOptionsNumber((current) =>
            current.filter((id) => id !== idToDelete)
        );
        setValue(`${idToDelete}-optionName`, "");
        setValue(`${idToDelete}-optionExtra`, "");
    }

    function onSubmit() {
        const { name, price, description, ...rest } = getValues();
        const optionObjects = optionsNumber.map((theId) => ({
            name: rest[`${theId}-optionName`],
            extra: Number(rest[`${theId}-optionExtra`]),
        }));
        createDishMutation({
            variables: {
                input: {
                    name,
                    price: Number(price),
                    description,
                    restaurantId: Number(restaurantId),
                    options: optionObjects,
                },
            },
        });
        navigate(-1);
    }

    return (
        <div className="container flex flex-col items-center mt-52">
            <article>
                <title>Add Dish</title>
            </article>
            <h4 className="font-semibold text-2xl mb-3">Add Dish</h4>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid max-w-screen-sm gap-3 mt-5 w-full mb-5"
            >
                <input
                    type="text"
                    className="input"
                    placeholder="Name"
                    {...register("name", { required: "Name is required" })}
                />
                <input
                    className="input"
                    type="number"
                    min={0}
                    placeholder="Price"
                    {...register("price", { required: "Price is required." })}
                />
                <input
                    className="input"
                    type="text"
                    placeholder="Description"
                    {...register("description", {
                        required: "Description is required.",
                    })}
                />
                <div className="my-10">
                    <h4 className="font-medium mb-3 text-lg">Dish Options</h4>
                    <span
                        onClick={onAddOptionClick}
                        className="cursor-pointer text-white bg-gray-900 py-1 px-2 mt-5 "
                    >
                        Add Dish Option
                    </span>
                    {optionsNumber.length !== 0 &&
                        optionsNumber.map((id) => (
                            <div key={id} className="mt-5">
                                <input
                                    className="py-2 px-4 focus:outline-none mr-3 focus:border-gray-600 border-2"
                                    type="text"
                                    placeholder="Option Name"
                                    {...register(`${id}-optionName`)}
                                />
                                <input
                                    className="py-2 px-4 focus:outline-none focus:border-gray-600 border-2"
                                    type="number"
                                    min={0}
                                    placeholder="Option Extra"
                                    {...register(`${id}-optionExtra`)}
                                />
                                <span
                                    onClick={() => onRemoveOptionClick(id)}
                                    className="cursor-pointer text-white bg-red-500 ml-3 py-3 px-4 mt-5 "
                                >
                                    Delete
                                </span>
                            </div>
                        ))}
                </div>
                <Button
                    loading={loading}
                    canClick={formState.isValid}
                    actionText="Create Dish"
                />
            </form>
        </div>
    );
}
export default AddDish;
