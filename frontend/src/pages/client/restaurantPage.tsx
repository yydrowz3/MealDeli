import { gql } from "@apollo/client";
import { DISH_FRAGMENT, RESTAURANT_FRAGMENT } from "../../fragments.ts";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "@apollo/client/react";
import type {
    CreateOrderItemInput,
    CreateOrderMutation,
    CreateOrderMutationVariables,
    RestaurantQuery,
    RestaurantQueryVariables,
} from "../../types/__generated__/graphql.ts";
import { useState } from "react";
import { toast } from "sonner";
import Dish from "../../components/dish.tsx";
import DishOption from "../../components/dish-option.tsx";

const RESTAURANT_QUERY = gql`
    query restaurant($input: RestaurantInput!) {
        restaurant(input: $input) {
            ok
            error
            restaurant {
                ...RestaurantParts
                menu {
                    ...DishParts
                }
            }
        }
    }
    ${RESTAURANT_FRAGMENT}
    ${DISH_FRAGMENT}
`;

const CREATE_ORDER_MUTATION = gql`
    mutation createOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
            ok
            error
            orderId
        }
    }
`;

function RestaurantPage() {
    const params = useParams();
    const navigate = useNavigate();
    const paramsId = Number(params.id) || 0;
    const { data } = useQuery<RestaurantQuery, RestaurantQueryVariables>(
        RESTAURANT_QUERY,
        {
            variables: {
                input: {
                    restaurantId: paramsId,
                },
            },
        }
    );

    const [createOrderMutation, { loading: placingOrder }] = useMutation<
        CreateOrderMutation,
        CreateOrderMutationVariables
    >(CREATE_ORDER_MUTATION, {
        onCompleted: (data: CreateOrderMutation) => {
            const {
                createOrder: { ok, orderId },
            } = data;
            if (ok) navigate(`/orders/${orderId}`);
        },
    });

    const [orderStarted, setOrderStarted] = useState<boolean>(false);
    const [orderItems, setOrderItems] = useState<CreateOrderItemInput[]>([]);

    function triggerStartOrder() {
        setOrderStarted(true);
    }

    function getItem(dishId: number) {
        return orderItems.find((order) => order.dishId === dishId);
    }

    function isSelected(dishId: number) {
        return Boolean(getItem(dishId));
    }

    function addItemToOrder(dishId: number) {
        if (isSelected(dishId)) return;
        setOrderItems((current) => [{ dishId, options: [] }, ...current]); // add item to an existing list
    }

    function removeFromOrder(dishId: number) {
        setOrderItems((current) =>
            current.filter((dish) => dish.dishId !== dishId)
        );
    }

    function addOptionToItem(dishId: number, optionName: string) {
        if (!isSelected(dishId)) return;
        const oldItem = getItem(dishId);
        if (oldItem) {
            const hasOption = Boolean(
                oldItem.options?.find(
                    (anOption) => anOption.name === optionName
                )
            );
            if (!hasOption) {
                removeFromOrder(dishId);
                setOrderItems((current) => [
                    {
                        dishId,
                        options: [{ name: optionName }, ...oldItem.options!],
                    },
                    ...current,
                ]);
            }
        }
    }

    function removeOptionFromItem(dishId: number, optionName: string) {
        if (!isSelected(dishId)) return;

        const oldItem = getItem(dishId);
        if (oldItem) {
            removeFromOrder(dishId);
            setOrderItems((current) => [
                {
                    dishId,
                    options: oldItem.options?.filter(
                        (option) => option.name !== optionName
                    ),
                },
                ...current,
            ]);
        }
    }

    function getOptionFromItem(item: CreateOrderItemInput, optionName: string) {
        return item.options?.find((option) => option.name === optionName);
    }

    function isOptionSelected(dishId: number, optionName: string) {
        const item = getItem(dishId);
        if (item) return Boolean(getOptionFromItem(item, optionName));
        return false;
    }

    function triggerCancelOrder() {
        setOrderStarted(false);
        setOrderItems([]);
    }

    function triggerConfirmOrder() {
        if (placingOrder) return;
        if (orderItems.length === 0)
            return toast.info("Can't place empty order");
        const ok = window.confirm("You are about to place an order");
        if (ok) {
            createOrderMutation({
                variables: {
                    input: { restaurantId: paramsId, items: orderItems },
                },
            });
        }
    }

    return (
        <div>
            <article>
                <title>{data?.restaurant.restaurant?.name || ""}</title>
            </article>
            <div
                className="bg-gray-800 bg-center bg-cover py-48"
                style={{
                    backgroundImage: `url(${data?.restaurant.restaurant?.coverImg})`,
                }}
            >
                <div className="bg-white xl:w-1/4 py-8 pl-48">
                    <h4 className="text-4xl mb-3">
                        {data?.restaurant.restaurant?.name}
                    </h4>
                    <h5 className="text-sm font-light mb-2">
                        {data?.restaurant.restaurant?.category?.name}
                    </h5>
                    <h6 className="text-sm font-light">
                        {data?.restaurant.restaurant?.address}
                    </h6>
                </div>
            </div>
            <div className="container pb-32 flex flex-col items-end mt-20">
                {orderStarted ? (
                    <div className="flex items-center">
                        <button
                            className="btn px-10 mr-3"
                            onClick={triggerConfirmOrder}
                        >
                            Confirm Order
                        </button>
                        <button
                            className="btn px-10 bg-black hover:bg-black"
                            onClick={triggerCancelOrder}
                        >
                            Cancel order
                        </button>
                    </div>
                ) : (
                    <button onClick={triggerStartOrder} className="btn px-10">
                        Start Order
                    </button>
                )}

                <div className="w-full grid mt-16 md:grid-cols-3 gap-x-5 gap-y-10">
                    {data?.restaurant.restaurant?.menu.map((dish, index) => (
                        <Dish
                            isSelected={isSelected(dish.id)}
                            id={dish.id}
                            orderStarted={orderStarted}
                            key={index}
                            name={dish.name}
                            description={dish.description}
                            price={dish.price}
                            isCustormer={true}
                            options={dish.options}
                            addItemToOrder={addItemToOrder}
                            removeFromOrder={removeFromOrder}
                        >
                            {dish.options?.map((option, index) => (
                                <DishOption
                                    key={index}
                                    dishId={dish.id}
                                    isSelected={isOptionSelected(
                                        dish.id,
                                        option.name
                                    )}
                                    name={option.name}
                                    extra={option.extra}
                                    addOptionToItem={addOptionToItem}
                                    removeOptionFromItem={removeOptionFromItem}
                                />
                            ))}
                        </Dish>
                    ))}
                </div>
            </div>
        </div>
    );
}
export default RestaurantPage;
