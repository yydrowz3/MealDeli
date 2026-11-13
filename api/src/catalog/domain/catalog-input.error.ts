export class CatalogInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = CatalogInputError.name;
  }
}
