pub mod subtitle;
pub mod store;
pub mod handlers;

pub fn content_url_opt(key: &Option<String>) -> ::askama::Result<String> {
    let host = dotenv::var("CONTENT_HOST").expect("CONTENT_HOST must be set.");
    if let Some(s) = key {
        Ok(format!("//{}/{}", host, s))
    } else {
        // default thumbnail
        Ok("".to_string())
    }
}

pub fn content_url(key: &str) -> ::askama::Result<String> {
    let host = dotenv::var("CONTENT_HOST").expect("CONTENT_HOST must be set.");
    Ok(format!("//{}/{}", host, key))
}