use actix_web::{HttpResponse, web};
use actix_web::error::{ ErrorInternalServerError};
use actix_web::get;
use aws_sdk_lambda::types::Blob;
use serde::{Deserialize};
use serde_json::{json, Value};

#[derive(Deserialize)]
pub struct VideoSearchRequest {
    #[serde(rename = "q")]
    query: String,
    video_id: Option<String>,
    lang: String,
}

#[get("/api/video/search")]
pub async fn handler(req: web::Query<VideoSearchRequest>) -> actix_web::Result<HttpResponse> {

    let tantivy_function_name = dotenv::var("TANTIVY_SEARCH_FUNCTION_NAME")
        .expect("TANTIVY_SEARCH_FUNCTION_NAME must be set.");
    let shared_config = aws_config::from_env().load().await;

    let lambda = aws_sdk_lambda::Client::new(&shared_config);

    let mut query = format!("({})", req.query);
    if let Some(video_id) = req.video_id.as_ref() {
        query.push_str(" AND ");
        query.push_str(video_id);
    }
    let payload = serde_json::to_string(&json!({
        "lang": req.lang,
        "query": query
    })).unwrap();
    let output = lambda.invoke()
        .function_name(tantivy_function_name)
        .payload(Blob::new(payload))
        .send()
        .await
        .map_err(ErrorInternalServerError)?;

    let bytes = output.payload.unwrap().into_inner();
    let value = serde_json::from_slice::<Value>(&bytes).unwrap();

    let res = HttpResponse::Ok()
        .json(value);

    Ok(res)
}