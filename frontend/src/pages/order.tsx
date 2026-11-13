import { gql, type TypedDocumentNode } from "@apollo/client";
import { FULL_ORDER_FRAGMENT } from "../fragments.ts";
import { useParams } from "react-router";
import { useMe } from "../hooks/useMe.tsx";
import { useMutation, useQuery } from "@apollo/client/react";
import {
    OrderStatus,
    UserRole,
    type EditOrderMutation,
    type EditOrderMutationVariables,
    type GetOrderQuery,
    type GetOrderQueryVariables,
    type OrderUpdatesSubscription,
    type OrderUpdatesSubscriptionVariables,
} from "../types/__generated__/graphql.ts";
import { useEffect } from "react";

const GET_ORDER_QUERY: TypedDocumentNode<
    GetOrderQuery,
    GetOrderQueryVariables
> = gql`
    query getOrder($input: GetOrderInput!) {
        getOrder(input: $input) {
            ok
            error
            order {
                ...FullOrderParts
            }
        }
    }
    ${FULL_ORDER_FRAGMENT}
`;

const ORDER_SUBSCRIPTION: TypedDocumentNode<
    OrderUpdatesSubscription,
    OrderUpdatesSubscriptionVariables
> = gql`
    subscription orderUpdates($input: OrderUpdatesInput!) {
        orderUpdates(input: $input) {
            ...FullOrderParts
        }
    }
    ${FULL_ORDER_FRAGMENT}
`;

const EDIT_ORDER_MUTATION = gql`
    mutation editOrder($input: EditOrderInput!) {
        editOrder(input: $input) {
            ok
            error
        }
    }
`;

function Order() {
    const params = useParams();
    const { data: userData } = useMe();
    const [editOrderMutation] = useMutation<
        EditOrderMutation,
        EditOrderMutationVariables
    >(EDIT_ORDER_MUTATION);
    const { data, subscribeToMore } = useQuery<
        GetOrderQuery,
        GetOrderQueryVariables
    >(GET_ORDER_QUERY, { variables: { input: { id: Number(params.id) } } });

    function onButtonClick(newStatus: OrderStatus) {
        editOrderMutation({
            variables: { input: { id: Number(params.id), status: newStatus } },
        });
    }

    useEffect(() => {
        if (data?.getOrder.ok) {
            subscribeToMore({
                document: ORDER_SUBSCRIPTION,
                variables: {
                    input: {
                        id: Number(params.id),
                    },
                },
                //@ts-expect-error updateQuery
                updateQuery: (
                    prev,
                    {
                        subscriptionData: { data },
                    }: { subscriptionData: { data: OrderUpdatesSubscription } }
                ) => {
                    if (!data) return prev;
                    return {
                        getOrder: {
                            ...prev.getOrder,
                            order: {
                                ...data.orderUpdates,
                            },
                        },
                    };
                },
            });
        }
    }, [data]);

    return (
        <div className="container mt-32 flex justify-center">
            <article>
                <title>Order #{params.id}</title>
            </article>
            <div className="border border-gray-800 w-full max-w-screen-sm flex flex-col justify-center">
                <h4 className="bg-gray-800 w-full py-5 text-white text-center text-xl">
                    Order #{params.id}
                </h4>
                <h5 className="p-5 pt-10 text-3xl text-center">
                    ${data?.getOrder.order?.total}
                </h5>
                <div className="p-5 text-xl grid gap-6">
                    <div className="border-t pt-5 border-gray-700">
                        Prepared By:{" "}
                        <span className="font-medium">
                            {data?.getOrder.order?.restaurant?.name}
                        </span>
                    </div>
                    <div className="border-t pt-5 border-gray-700">
                        Deliver To:{" "}
                        <span className="font-medium">
                            {data?.getOrder.order?.customer?.email}
                        </span>
                    </div>
                    <div className="border-t border-b py-5 border-gray-700">
                        Driver:{" "}
                        <span className="font-medium">
                            {data?.getOrder.order?.driver?.email || "Not yet"}
                        </span>
                    </div>
                    {userData?.me.role === UserRole.Client && (
                        <span className="text-center mt-5 mb-3 text-2xl text-lime-600">
                            Status: {data?.getOrder.order?.status}
                        </span>
                    )}
                    {userData?.me.role === UserRole.Owner && (
                        <>
                            {data?.getOrder.order?.status ===
                                OrderStatus.Pending && (
                                <button
                                    className="btn"
                                    onClick={() =>
                                        onButtonClick(OrderStatus.Cooking)
                                    }
                                >
                                    Accept Order
                                </button>
                            )}
                            {data?.getOrder.order?.status ===
                                OrderStatus.Cooking && (
                                <button
                                    onClick={() =>
                                        onButtonClick(OrderStatus.Cooked)
                                    }
                                    className="btn"
                                >
                                    Order Cooked
                                </button>
                            )}
                            {data?.getOrder.order?.status !==
                                OrderStatus.Cooking &&
                                data?.getOrder.order?.status !==
                                    OrderStatus.Pending && (
                                    <span className="text-center mt-5 mb-3 text-2xl text-lime-600">
                                        Status: {data?.getOrder.order?.status}
                                    </span>
                                )}
                        </>
                    )}
                    {userData?.me.role === UserRole.Delivery && (
                        <>
                            {data?.getOrder.order?.status ===
                                OrderStatus.Cooked && (
                                <button
                                    className="btn"
                                    onClick={() =>
                                        onButtonClick(OrderStatus.PickedUp)
                                    }
                                >
                                    Pick Up
                                </button>
                            )}
                            {data?.getOrder.order?.status ===
                                OrderStatus.PickedUp && (
                                <button
                                    className="btn"
                                    onClick={() =>
                                        onButtonClick(OrderStatus.Delivered)
                                    }
                                >
                                    Order Delivered
                                </button>
                            )}
                        </>
                    )}
                    {data?.getOrder.order?.status === OrderStatus.Delivered && (
                        <span className="text-center mt-5 mb-3 text-2xl text-lime-600">
                            Thank you for your order
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Order;
