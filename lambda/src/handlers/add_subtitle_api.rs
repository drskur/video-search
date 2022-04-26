use actix_web::{HttpResponse, web};
use actix_web::post;
use serde::{Deserialize};
use crate::store::video::get_video;
use crate::subtitle::SubtitleQueueMessage;

#[derive(Deserialize)]
pub struct AddSubtitleRequest {
    video_id: String,
    target_lang: Option<String>
}

#[post("/api/video/subtitle")]
pub async fn handler(req: web::Json<AddSubtitleRequest>) -> actix_web::Result<HttpResponse> {

    let queue_url = dotenv::var("QUEUE_URL")
        .expect("QUEUE_URL must be set.");

    let shared_config = aws_config::from_env().load().await;

    if let Ok(video) = get_video(&req.video_id).await {
        let content_language = &video.lang.split("-").collect::<Vec<_>>()[0];
        let msg = SubtitleQueueMessage::new(
            &req.video_id,
            *content_language,
            req.target_lang.as_ref().map(|l| l.as_str()));

        let sqs = aws_sdk_sqs::Client::new(&shared_config);
        sqs.send_message()
            .queue_url(&queue_url)
            .message_body(serde_json::to_string(&msg).unwrap())
            .send()
            .await
            .unwrap();

        Ok(HttpResponse::Created().finish())
    } else {
        Ok(HttpResponse::BadRequest().finish())
    }
}