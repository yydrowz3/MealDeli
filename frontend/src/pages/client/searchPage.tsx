import { gql } from "@apollo/client";
import { useLocation, useNavigate } from "react-router";
import { RESTAURANT_FRAGMENT } from "../../fragments.ts";
import { useLazyQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";
import type {
    SearchRestaurantQuery,
    SearchRestaurantQueryVariables,
} from "../../types/__generated__/graphql.ts";
import Restaurant from "../../components/restaurant.tsx";

const SEARCH_RESTAURANT_QUERY = gql`
    query searchRestaurant($input: SearchRestaurantInput!) {
        searchRestaurant(input: $input) {
            ok
            error
            totalPages
            totalResults
            restaurants {
                ...RestaurantParts
            }
        }
    }
    ${RESTAURANT_FRAGMENT}
`;

function SearchPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [callQuery, { loading, data }] = useLazyQuery<
        SearchRestaurantQuery,
        SearchRestaurantQueryVariables
    >(SEARCH_RESTAURANT_QUERY);

    function onNextPageClick() {
        setPage((current) => current + 1); // 直接写current + 1 会变成一个计算的值
    }
    function onPrevPageClick() {
        setPage((current) => current - 1);
    }

    useEffect(() => {
        const [, query] = location.search.split("?term=");
        if (!query) {
            navigate("/", { replace: true });
        } else {
            callQuery({
                variables: {
                    input: {
                        page: 1,
                        query,
                    },
                },
            });
        }
    }, [navigate, location, callQuery]);

    return (
        <div>
            <article>
                <title>Search</title>
            </article>

            {!loading && (
                <div className="max-w-screen-2xl pb-20 mx-auto mt-8">
                    <div className="grid mt-16 md:grid-cols-3 gap-x-5 gap-y-10">
                        {data?.searchRestaurant.restaurants?.map(
                            (restaurant) => (
                                <Restaurant
                                    key={restaurant.id}
                                    id={restaurant.id + ""}
                                    coverImg={restaurant.coverImg}
                                    name={restaurant.name}
                                    categoryName={restaurant.category?.name}
                                ></Restaurant>
                            )
                        )}
                    </div>

                    <div className="grid grid-cols-3 text-center max-w-md items-center mx-auto mt-10">
                        {page > 1 ? (
                            <button
                                className="focus:outline-none font-medium text-2xl"
                                onClick={onPrevPageClick}
                            >
                                &larr;
                            </button>
                        ) : (
                            <div></div>
                        )}
                        <span>
                            Page {page} of {data?.searchRestaurant.totalPages}
                        </span>
                        {page !== data?.searchRestaurant.totalPages ? (
                            <button
                                onClick={onNextPageClick}
                                className="focus:outline-none font-medium text-2xl"
                            >
                                &rarr;
                            </button>
                        ) : (
                            <div></div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
export default SearchPage;
