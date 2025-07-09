// Re-export types from graphql.rs
#[allow(unused_imports)]
pub use crate::graphql::{Category, GraphQLContext, MutationRoot, QueryRoot, Transaction};

use juniper::{EmptySubscription, RootNode};

// Re-export the schema type for convenience
pub type Schema = RootNode<'static, QueryRoot, MutationRoot, EmptySubscription<GraphQLContext>>;

pub fn create_schema() -> Schema {
    Schema::new(QueryRoot, MutationRoot, EmptySubscription::new())
}
