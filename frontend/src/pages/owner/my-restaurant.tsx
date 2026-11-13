import { gql } from "@apollo/client";
import {
    DISH_FRAGMENT,
    FULL_ORDER_FRAGMENT,
    ORDERS_FRAGMENT,
    RESTAURANT_FRAGMENT,
} from "../../fragments.ts";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useSubscription } from "@apollo/client/react";
import type {
    CreatePaymentMutation,
    CreatePaymentMutationVariables,
    MyRestaurantQuery,
    MyRestaurantQueryVariables,
    PendingOrdersSubscription,
    PendingOrdersSubscriptionVariables,
} from "../../types/__generated__/graphql.ts";
import Dish from "../../components/dish.tsx";
import {
    VictoryAxis,
    VictoryChart,
    VictoryLabel,
    VictoryLine,
    VictoryTheme,
    VictoryTooltip,
    VictoryVoronoiContainer,
} from "victory";
import { useMe } from "../../hooks/useMe.tsx";
import { toast } from "sonner";
import { useEffect } from "react";

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

const CREATE_PAYMENT_MUTATION = gql`
    mutation createPayment($input: CreatePaymentInput!) {
        createPayment(input: $input) {
            ok
            error
        }
    }
`;

const PENDING_ORDERS_SUBSCRIPTION = gql`
    subscription pendingOrders {
        pendingOrders {
            ...FullOrderParts
        }
    }
    ${FULL_ORDER_FRAGMENT}
`;

function MyRestaurant() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data } = useQuery<MyRestaurantQuery, MyRestaurantQueryVariables>(
        MY_RESTAURANT_QUERY,
        {
            variables: { input: { id: Number(id) } },
        }
    );

    const [createPaymentMutation] = useMutation<
        CreatePaymentMutation,
        CreatePaymentMutationVariables
    >(CREATE_PAYMENT_MUTATION, {
        onCompleted: (data) => {
            if (data.createPayment.ok) {
                toast.success("Your restaurant is being promoted!");
            }
        },
    });

    const { data: userData } = useMe();
    async function triggerPaddle() {
        if (userData?.me.email) {
            //@ts-expect-error paddle
            window.Paddle.Setup({ vendor: "247630" });
            //@ts-expect-error paddle
            window.Paddle.Checkout.open({
                product: "pro_01k4n1zqfn2ss86e02w72x3xty",
                email: userData.me.email,
                successCallback: (data: { checkout: { id: string } }) => {
                    createPaymentMutation({
                        variables: {
                            input: {
                                transactionId: data.checkout.id,
                                restaurantId: Number(id),
                            },
                        },
                    });
                },
            });
        }
    }

    const { data: subscriptionData } = useSubscription<
        PendingOrdersSubscription,
        PendingOrdersSubscriptionVariables
    >(PENDING_ORDERS_SUBSCRIPTION);

    useEffect(() => {
        if (subscriptionData?.pendingOrders.id) {
            navigate(`/orders/${subscriptionData.pendingOrders.id}`);
        }
    }, [subscriptionData, navigate]);

    return (
        <div>
            <article>
                <title>
                    {data?.myRestaurant.restaurant?.name || "Loading..."}
                </title>
                <script src="https://cdn.paddle.com/paddle/paddle.js"></script>
            </article>
            <div className="checkout-container"></div>
            <div
                className="  bg-gray-700  py-28 bg-center bg-cover"
                style={{
                    backgroundImage: `url(${data?.myRestaurant.restaurant?.coverImg})`,
                }}
            ></div>
            <div className="container mt-10">
                <h2 className="text-4xl font-medium mb-10">
                    {data?.myRestaurant.restaurant?.name || "Loading..."}
                </h2>
                <Link
                    to={`/restaurant/${id}/add-dish`}
                    className=" mr-8 text-white bg-gray-800 py-3 px-10"
                >
                    Add Dish &rarr;
                </Link>
                <span
                    onClick={triggerPaddle}
                    className="cursor-pointer text-white bg-lime-700 py-3 px-10"
                >
                    Buy Promotion &rarr;
                </span>
                <div className="mt-10">
                    {data?.myRestaurant.restaurant?.menu.length === 0 ? (
                        <h4 className="text-xl mb-5">Please upload a dish!</h4>
                    ) : (
                        <div className="grid mt-16 md:grid-cols-3 gap-x-5 gap-y-10">
                            {data?.myRestaurant.restaurant?.menu.map(
                                (dish, index) => (
                                    <Dish
                                        key={index}
                                        name={dish.name}
                                        description={dish.description}
                                        price={dish.price}
                                    />
                                )
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-20 mb-10">
                    <h4 className="text-center text-2xl font-medium">Sales</h4>
                    <div className="mt-10">
                        <VictoryChart
                            height={500}
                            theme={VictoryTheme.material}
                            width={window.innerWidth}
                            domainPadding={50}
                            containerComponent={<VictoryVoronoiContainer />}
                        >
                            <VictoryLine
                                labels={({ datum }: { datum: { y: number } }) =>
                                    `$${datum.y}`
                                }
                                labelComponent={
                                    <VictoryTooltip
                                        style={{ fontSize: 18 }}
                                        renderInPortal
                                        dy={-20}
                                    />
                                }
                                data={data?.myRestaurant.restaurant?.orders.map(
                                    (order) => ({
                                        x: order.createdAt,
                                        y: order.total,
                                    })
                                )}
                                interpolation="natural"
                                style={{
                                    data: {
                                        strokeWidth: 5,
                                    },
                                }}
                            />
                            <VictoryAxis
                                tickLabelComponent={
                                    <VictoryLabel renderInPortal />
                                }
                                style={{ tickLabels: { fontSize: 20 } }}
                                tickFormat={(tick: string) =>
                                    new Date(tick).toLocaleDateString()
                                }
                            />
                        </VictoryChart>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default MyRestaurant;
