use actix_web::http::header;
use actix_web::HttpResponse;
use askama::Template;
use actix_web::get;

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {}

impl IndexTemplate{
    pub fn new() -> Self {
        IndexTemplate{}
    }
}

#[get("/")]
pub async fn handler() -> actix_web::Result<HttpResponse> {
    let html = IndexTemplate::new()
        .render()
        .unwrap();

    let response = HttpResponse::Ok()
        .content_type(header::ContentType::html())
        .body(html);

    Ok(response)
}