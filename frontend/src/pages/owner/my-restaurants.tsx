import { gql } from "@apollo/client";
import { RESTAURANT_FRAGMENT } from "../../fragments.ts";
import { useQuery } from "@apollo/client/react";
import type {
    MyRestaurantsQuery,
    MyRestaurantsQueryVariables,
} from "../../types/__generated__/graphql.ts";
import { Link } from "react-router";
import Restaurant from "../../components/restaurant.tsx";

const MY_RESTAURANTS_QUERY = gql`
    query myRestaurants {
        myRestaurants {
            ok
            error
            restaurants {
                ...RestaurantParts
            }
        }
    }
    ${RESTAURANT_FRAGMENT}
`;

function MyRestaurants() {
    const { data } = useQuery<MyRestaurantsQuery, MyRestaurantsQueryVariables>(
        MY_RESTAURANTS_QUERY
    );
    return (
        <div>
            <article>
                <title>My Restaurants</title>
            </article>
            <div className="max-w-screen-2xl mx-auto mt-32">
                <h2 className="text-4xl font-medium mb-10">My Restaurants</h2>
                {data?.myRestaurants.ok &&
                data?.myRestaurants.restaurants?.length === 0 ? (
                    <>
                        <h4 className="text-xl mb-5">
                            You have no restaurants
                        </h4>
                        <Link
                            className="text-lime-600 hover:underline"
                            to="/add-restaurant"
                        >
                            Create one &rarr;
                        </Link>
                    </>
                ) : (
                    <div className="grid mt-16 md:grid-cols-3 gap-x-5 gap-y-10">
                        {data?.myRestaurants.restaurants?.map((restaurant) => (
                            <Restaurant
                                key={restaurant.id}
                                id={String(restaurant.id)}
                                coverImg={restaurant.coverImg}
                                name={restaurant.name}
                                categoryName={restaurant.category?.name}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
export default MyRestaurants;
