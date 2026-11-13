import { gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import type {
    CreateRestaurantMutation,
    CreateRestaurantMutationVariables,
    MyRestaurantsQuery,
    MyRestaurantsQueryVariables,
} from "../../types/__generated__/graphql.ts";
import Button from "../../components/button.tsx";
import FormError from "../../components/form-error.tsx";
import { RESTAURANT_FRAGMENT } from "../../fragments.ts";

const CREATE_RESTAURANT_MUTATION = gql`
    mutation createRestaurant($input: CreateRestaurantInput!) {
        createRestaurant(input: $input) {
            error
            ok
            restaurantId
        }
    }
`;

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

interface IFormProps {
    name: string;
    address: string;
    categoryName: string;
    file: FileList;
}

function AddRestaurants() {
    const client = useApolloClient();
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const { register, handleSubmit, getValues, formState } =
        useForm<IFormProps>({
            mode: "onChange",
        });
    const [createRestaurantMutation, { data }] = useMutation<
        CreateRestaurantMutation,
        CreateRestaurantMutationVariables
    >(CREATE_RESTAURANT_MUTATION, {
        onCompleted: (data) => {
            const {
                createRestaurant: { ok, restaurantId },
            } = data;
            if (ok) {
                const { name, categoryName, address } = getValues();
                setUploading(false);
                // can also do a refetch way
                const queryResult = client.readQuery<
                    MyRestaurantsQuery,
                    MyRestaurantsQueryVariables
                >({
                    query: MY_RESTAURANTS_QUERY,
                });
                client.writeQuery({
                    query: MY_RESTAURANTS_QUERY,
                    data: {
                        myRestaurants: {
                            ...queryResult?.myRestaurants,
                            restaurants: [
                                {
                                    address,
                                    category: {
                                        name: categoryName,
                                        __typename: "Category",
                                    },
                                    coverImg: imageUrl,
                                    id: restaurantId,
                                    isPromoted: false,
                                    name,
                                    __typename: "Restaurant",
                                },
                                ...(queryResult?.myRestaurants?.restaurants ??
                                    []),
                            ],
                        },
                    },
                });
                navigate("/");
            }
        },
    });

    async function onSubmit() {
        try {
            setUploading(true);
            const { file, name, address, categoryName } = getValues();
            const actualFile = file[0];
            const formBody = new FormData();
            formBody.append("file", actualFile);
            const { url: coverImg } = await (
                await fetch("http://localhost:3000/uploads", {
                    method: "POST",
                    body: formBody,
                })
            ).json();
            setImageUrl(coverImg);
            createRestaurantMutation({
                variables: {
                    input: {
                        address,
                        categoryName,
                        coverImg,
                        name,
                    },
                },
            });
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <div className="container flex flex-col items-center mt-52">
            <article>
                <title>Add Restaurant</title>
            </article>
            <h4 className="font-semibold text-2xl mb-3">Add Restaurant</h4>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid max-w-screen-sm gap-3 mt-5 w-full mb-5"
            >
                <input
                    className="input"
                    type="text"
                    placeholder="Name"
                    {...register("name", { required: "Name is required." })}
                />
                <input
                    className="input"
                    type="text"
                    placeholder="Address"
                    {...register("address", {
                        required: "Address is required.",
                    })}
                />
                <input
                    className="input"
                    type="text"
                    placeholder="Category Name"
                    {...register("categoryName", {
                        required: "Category Name is required.",
                    })}
                />
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        {...register("file", { required: true })}
                    />
                </div>
                <Button
                    loading={uploading}
                    canClick={formState.isValid}
                    actionText="Create Restaurant"
                />
                {data?.createRestaurant?.error && (
                    <FormError errorMessage={data.createRestaurant.error} />
                )}
            </form>
        </div>
    );
}
export default AddRestaurants;
