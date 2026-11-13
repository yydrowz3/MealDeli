import { gql } from "@apollo/client";
import { FULL_ORDER_FRAGMENT } from "../../fragments.ts";
import { useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useMutation, useSubscription } from "@apollo/client/react";
import {
    type CookedOrdersSubscription,
    type TakeOrderMutation,
    type CookedOrdersSubscriptionVariables,
    type TakeOrderMutationVariables,
} from "../../types/__generated__/graphql.ts";

const COOCKED_ORDERS_SUBSCRIPTION = gql`
    subscription cookedOrders {
        cookedOrders {
            ...FullOrderParts
        }
    }
    ${FULL_ORDER_FRAGMENT}
`;

const TAKE_ORDER_MUTATION = gql`
    mutation takeOrder($input: TakeOrderInput!) {
        takeOrder(input: $input) {
            ok
            error
        }
    }
`;

interface ICoords {
    lat: number;
    lng: number;
}

function Dashboard() {
    const [driverCoords, setDriverCoords] = useState<ICoords>({
        lng: 36.7298624,
        lat: 127.1092041,
    });
    const mapRef = useRef<google.maps.Map>(null);
    const GOOGLE_MAP_KEY = import.meta.env.VITE_GOOGLE_MAPS;
    const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAP_KEY });

    const navigate = useNavigate();

    const { data: cookedOrdersData } = useSubscription<
        CookedOrdersSubscription,
        CookedOrdersSubscriptionVariables
    >(COOCKED_ORDERS_SUBSCRIPTION);

    const [takeOrderMutation] = useMutation<
        TakeOrderMutation,
        TakeOrderMutationVariables
    >(TAKE_ORDER_MUTATION, {
        onCompleted: (data) => {
            if (data.takeOrder.ok) {
                navigate(`/orders/${cookedOrdersData?.cookedOrders.id}`);
            }
        },
    });

    function onSuccess({
        coords: { latitude, longitude },
    }: GeolocationPosition) {
        const newCoords = { lat: latitude, lng: longitude };
        setDriverCoords(newCoords);
        if (mapRef.current) {
            mapRef.current.panTo(newCoords);
        }
    }

    function onError(error: GeolocationPositionError) {
        toast.error(error.message);
    }

    function onLoad(map: google.maps.Map) {
        mapRef.current = map;
        toast.info("map api loaded");
    }

    // function onApiLoaded({
    //     map,
    //     maps,
    // }: {
    //     map: google.maps.Map;
    //     maps: google.maps.Map;
    // }) {
    //     map.panTo(new google.maps.LatLng(driverCoords.lat, driverCoords.lng));
    //     setMap(map);
    //     setMaps(maps);
    // }

    function triggerMutation(orderId: number) {
        takeOrderMutation({ variables: { input: { id: orderId } } });
    }

    // function makeRoute() {
    //     if (map) {
    //         const directionsService = new google.maps.DirectionsService();
    //         const directionsRenderer = new google.maps.DirectionsRenderer({
    //             polylineOptions: {
    //                 strokeColor: "#000",
    //                 strokeOpacity: 1,
    //                 // strokeWeight: 5,
    //             },
    //         });
    //         directionsRenderer.setMap(map);
    //         directionsService.route(
    //             {
    //                 origin: {
    //                     location: new google.maps.LatLng(
    //                         driverCoords.lat,
    //                         driverCoords.lng
    //                     ),
    //                 },
    //                 destination: {
    //                     location: new google.maps.LatLng(
    //                         driverCoords.lat + 0.05,
    //                         driverCoords.lng + 0.05
    //                     ),
    //                 },
    //                 travelMode: google.maps.TravelMode.DRIVING,
    //             },
    //             (result) => {
    //                 directionsRenderer.setDirections(result);
    //             }
    //         );
    //     }
    // }
    function makeRoute() {
        if (mapRef.current) {
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
                polylineOptions: { strokeColor: "orange" },
            });
            directionsRenderer.setMap(mapRef.current);
            directionsService.route(
                {
                    origin: driverCoords,
                    destination: { lat: 37.7283696, lng: 127.1140292 },
                    travelMode: google.maps.TravelMode.TRANSIT,
                },
                (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                        directionsRenderer.setDirections(result);
                    } else {
                        toast.info("Directions Status Failed");
                    }
                }
            );
        }
    }

    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            onSuccess,
            onError,
            {
                enableHighAccuracy: true,
            }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // useEffect(() => {
    //     if (map && maps) {
    //         map.panTo(
    //             new google.maps.LatLng(driverCoords.lat, driverCoords.lng)
    //         );
    //     }
    // }, [driverCoords.lat, driverCoords.lng, map, maps]);

    useEffect(() => {
        if (cookedOrdersData?.cookedOrders.id) {
            makeRoute();
        }
    }, [cookedOrdersData]);

    return (
        <>
            <article>
                <title>Dashboard</title>
            </article>
            {isLoaded ? (
                <div>
                    <div className="overflow-hidden">
                        <GoogleMap
                            mapContainerStyle={{
                                width: "100%",
                                height: "50vh",
                            }}
                            center={driverCoords}
                            zoom={16}
                            onLoad={onLoad}
                        ></GoogleMap>
                    </div>
                    <div className="max-w-screen-sm mx-auto bg-white relative -top-10 shadow-lg py-8 px-5">
                        {cookedOrdersData?.cookedOrders.restaurant ? (
                            <>
                                <h1 className="text-center text-3xl font-medium">
                                    New Cooked Order
                                </h1>
                                <h1 className="text-center my-3 text-2xl font-medium">
                                    Pick it up soon @{" "}
                                    {
                                        cookedOrdersData?.cookedOrders
                                            .restaurant?.name
                                    }
                                </h1>
                                <button
                                    className="btn w-full block text-center mt-5"
                                    onClick={() =>
                                        triggerMutation(
                                            cookedOrdersData?.cookedOrders.id
                                        )
                                    }
                                >
                                    Accept Challenge &rarr;
                                </button>
                            </>
                        ) : (
                            <h1 className="text-center text-3xl font-medium">
                                No orders yet...
                            </h1>
                        )}
                    </div>
                </div>
            ) : (
                <h1>Loading map...</h1>
            )}
        </>
    );
}
export default Dashboard;
