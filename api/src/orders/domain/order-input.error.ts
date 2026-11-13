export class OrderInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = OrderInputError.name;
  }
}
