import { Link } from "react-router";

function NotFound() {
    return (
        <div className="h-screen flex flex-col items-center justify-center">
            <article>
                <title>Page Not Found</title>
            </article>
            <h2 className="font-semibold text-2xl mb-3">Page Not Found.</h2>
            <h4 className="font-medium text-base mb-5">
                The page you're looking for does not esist.
            </h4>
            <Link className="hover:underline text-lime-600" to="/">
                Go back Home &rarr;
            </Link>
        </div>
    );
}
export default NotFound;
