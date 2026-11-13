interface IFormProps {
    errorMessage: string;
}

function FormError({ errorMessage }: IFormProps) {
    return (
        <span role="alert" className="font-medium text-red-500">
            {errorMessage}
        </span>
    );
}
export default FormError;
