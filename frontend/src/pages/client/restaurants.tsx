import { gql } from "@apollo/client";
import { useState } from "react";
import { CATEGORY_FRAGMENT, RESTAURANT_FRAGMENT } from "../../fragments.ts";
import { useQuery } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type {
    RestaurantsPageQuery,
    RestaurantsPageQueryVariables,
} from "../../types/__generated__/graphql.ts";
import Restaurant from "../../components/restaurant.tsx";

const RESTAURANTS_QUERY = gql`
    query restaurantsPage($input: RestaurantsInput!) {
        allCategories {
            ok
            error
            categories {
                ...CategoryParts
            }
        }
        restaurants(input: $input) {
            ok
            error
            totalPages
            totalResults
            results {
                ...RestaurantParts
            }
        }
    }
    ${RESTAURANT_FRAGMENT}
    ${CATEGORY_FRAGMENT}
`;

interface IFormProps {
    searchTerm: string;
}

function Restaurants() {
    const [page, setPage] = useState(1);
    const { register, handleSubmit, getValues } = useForm<IFormProps>();
    const navigate = useNavigate();
    const { data, loading } = useQuery<
        RestaurantsPageQuery,
        RestaurantsPageQueryVariables
    >(RESTAURANTS_QUERY, {
        variables: { input: { page } },
    });
    function onNextPageClick() {
        setPage((current) => current + 1); // 直接写current + 1 会变成一个计算的值
    }
    function onPrevPageClick() {
        setPage((current) => current - 1);
    }
    function onSearchSubmit() {
        const { searchTerm } = getValues();
        navigate({
            pathname: "/search",
            search: `?term=${searchTerm}`,
        });
    }

    return (
        <div>
            <article>
                <title>Home</title>
            </article>
            <form
                onSubmit={handleSubmit(onSearchSubmit)}
                className="bg-green-200 w-full py-40 flex items-center justify-center"
            >
                <input
                    type="Search"
                    className="bg-white input rounded-md border-0 w-3/4 md:w-3/12"
                    placeholder="Search restaurants..."
                    {...register("searchTerm", { required: true, min: 3 })}
                />
            </form>
            {!loading && (
                <div className="max-w-screen-2xl pb-20 mx-auto mt-8">
                    <div className="flex max-w-sm mx-auto justify-center">
                        {data?.allCategories.categories?.map((category) => (
                            <Link
                                key={category.id}
                                to={`/category/${category.slug}`}
                            >
                                <div className="flex flex-col group items-center cursor-pointer">
                                    <div
                                        className="w-16 h-16 bg-cover group-hover:bg-gray-100 rounded-full"
                                        style={{
                                            backgroundImage: `url(${category.coverImg})`,
                                        }}
                                    ></div>
                                    <span className="mt-1 text-sm text-center font-medium">
                                        {category.name}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="grid mt-16 md:grid-cols-3 gap-x-5 gap-y-10">
                        {data?.restaurants.results?.map((restaurant) => (
                            <Restaurant
                                key={restaurant.id}
                                id={restaurant.id + ""}
                                coverImg={restaurant.coverImg}
                                name={restaurant.name}
                                categoryName={restaurant.category?.name}
                            ></Restaurant>
                        ))}
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
                            Page {page} of {data?.restaurants.totalPages}
                        </span>
                        {page !== data?.restaurants.totalPages ? (
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
export default Restaurants;
