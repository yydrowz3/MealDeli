import { gql } from "@apollo/client";
import { useParams } from "react-router";
import { CATEGORY_FRAGMENT, RESTAURANT_FRAGMENT } from "../../fragments.ts";
import { useQuery } from "@apollo/client/react";
import type {
    CategoryQuery,
    CategoryQueryVariables,
} from "../../types/__generated__/graphql.ts";
import Restaurant from "../../components/restaurant.tsx";
import { useState } from "react";

const CATEGORY_QUERY = gql`
    query category($input: CategoryInput!) {
        category(input: $input) {
            ok
            error
            totalPages
            totalResults
            restaurants {
                ...RestaurantParts
            }
            category {
                ...CategoryParts
            }
        }
    }
    ${RESTAURANT_FRAGMENT}
    ${CATEGORY_FRAGMENT}
`;

function CategoryPage() {
    const params = useParams();
    const paramsSlug = params.slug || "";
    const [page, setPage] = useState(1);
    const { data, loading } = useQuery<CategoryQuery, CategoryQueryVariables>(
        CATEGORY_QUERY,
        {
            variables: {
                input: {
                    page: 1,
                    slug: paramsSlug,
                },
            },
        }
    );

    function onNextPageClick() {
        setPage((current) => current + 1); // 直接写current + 1 会变成一个计算的值
    }
    function onPrevPageClick() {
        setPage((current) => current - 1);
    }
    return (
        <>
            <article>
                <title>Category</title>
            </article>

            {!loading && (
                <div className="max-w-screen-2xl pb-20 mx-auto mt-8">
                    <div className="grid mt-16 md:grid-cols-3 gap-x-5 gap-y-10">
                        {data?.category.restaurants?.map((restaurant) => (
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
                            Page {page} of {data?.category.totalPages}
                        </span>
                        {page !== data?.category.totalPages ? (
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
        </>
    );
}
export default CategoryPage;
