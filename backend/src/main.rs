use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use juniper_actix::{graphiql_handler, graphql_handler};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;

use crate::gql_schema::GraphQLContext;

mod config;
pub mod db_models;
mod gql_schema;
mod graphql;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    config::Config::init();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let env = config::Config::get_env_var_with_default("ENV", "development");
    let is_dev = env == "development";
    let port = config::Config::get_env_var_with_default("API_PORT", "8080");
    let bind_address = format!("0.0.0.0:{}", port);

    println!("Starting server in {} mode on {}", env, bind_address);

    // Get database connection parameters with error handling
    let host = config::Config::get_env_var("DB_HOST").map_err(std::io::Error::other)?;
    let port = config::Config::get_env_var("DB_PORT").map_err(std::io::Error::other)?;
    let user = config::Config::get_env_var("DB_USER").map_err(std::io::Error::other)?;
    let password = config::Config::get_env_var("DB_PASSWORD").map_err(std::io::Error::other)?;
    let dbname = config::Config::get_env_var("DB_NAME").map_err(std::io::Error::other)?;

    // Construct database URL
    let database_url = format!(
        "postgresql://{}:{}@{}:{}/{}",
        user, password, host, port, dbname
    );

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(std::io::Error::other)?;

    let context = GraphQLContext { pool };
    let schema = Arc::new(gql_schema::create_schema());

    // Start the HTTP server
    let server = HttpServer::new(move || {
        let cors = Cors::permissive();

        let mut app = App::new()
            .app_data(web::Data::new(schema.clone()))
            .app_data(web::Data::new(context.clone()))
            .wrap(cors)
            .service(web::resource("/graphql").route(web::post().to(graphql_endpoint)));

        // Add GraphiQL interface in development mode
        if is_dev {
            app = app.service(web::resource("/graphiql").route(web::get().to(graphiql_endpoint)));
        }

        app
    });

    server.bind(bind_address)?.run().await
}

// GraphQL endpoint handler
async fn graphql_endpoint(
    schema: web::Data<Arc<gql_schema::Schema>>,
    context: web::Data<gql_schema::GraphQLContext>,
    req: actix_web::HttpRequest,
    payload: web::Payload,
) -> actix_web::Result<actix_web::HttpResponse> {
    let resp = graphql_handler(&schema, &context, req, payload).await;
    println!("GraphQL response: {:#?}", resp);
    resp
}

// GraphiQL endpoint handler
async fn graphiql_endpoint() -> actix_web::Result<actix_web::HttpResponse> {
    graphiql_handler("/graphql", None).await
}
