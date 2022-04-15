use actix_web::error::ErrorInternalServerError;
use actix_web::HttpResponse;
use actix_web::get;
use actix_web::http::header::ContentType;
use askama::Template;

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {}

#[get("/")]
pub async fn handler() -> actix_web::Result<HttpResponse> {
    let html = IndexTemplate{}
        .render()
        .map_err(|e| ErrorInternalServerError(e))?;

    let response = HttpResponse::Ok()
        .content_type(ContentType::html())
        .body(html);

    Ok(response)
}