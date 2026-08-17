# Orders realtime deployment note

Order subscriptions currently use `graphql-subscriptions` in-process `PubSub`. The
publisher and subscriber must therefore run in the same API process. Deploy this
version as a single API instance; multiple instances require a shared PubSub
backend before realtime order updates can be considered reliable across instances.

The Courier-specific `availableOrders` query, Serializable `takeOrder` transaction,
and single-active-delivery constraint are intentionally implemented by the Courier
module increment after the shared Orders contract is accepted.
