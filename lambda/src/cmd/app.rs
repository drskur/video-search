use actix_web::dev::ServiceRequest;
use actix_web::{App, Error, HttpServer};
use actix_web::error::ErrorUnauthorized;
use actix_web::middleware::Logger;
use actix_web_httpauth::extractors::basic::BasicAuth;
use actix_web_httpauth::middleware::HttpAuthentication;
use env_logger::Env;
use lambda_web::{is_running_on_lambda, LambdaError, run_actix_on_lambda};

async fn validator(req: ServiceRequest, credentials: BasicAuth) -> Result<ServiceRequest, Error> {

    if credentials.user_id() != "drskur" {
        return Err(ErrorUnauthorized("unauthorized"))
    }

    Ok(req)
}

#[actix_web::main]
async fn main() -> Result<(), LambdaError> {

    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let factory = move || {
        let auth = HttpAuthentication::basic(validator);
        App::new()
            .wrap(auth)
            .wrap(Logger::default())
            .service(lib::handlers::index::handler)
            .service(lib::handlers::video_new::handler)
    };

    if is_running_on_lambda() {
        run_actix_on_lambda(factory).await?;
    } else {
        HttpServer::new(factory)
            .bind("127.0.0.1:8080")?
            .run()
            .await?;
    }

    Ok(())
}