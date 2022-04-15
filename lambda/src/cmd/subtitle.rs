use aws_sdk_translate::Region;
use lambda_runtime::{Error, service_fn, LambdaEvent};
use lib::subtitle::Subtitle;

#[tokio::main]
async fn main() -> Result<(), Error> {
    // let func = service_fn(handler);
    // lambda_runtime::run(func).await?;

    handler().await?;

    Ok(())
}

async fn handler() -> Result<(), Error> {

    let shared_config = aws_config::from_env()
        .region(Region::new("ap-northeast-2"))
        .load().await;
    let client = aws_sdk_translate::Client::new(&shared_config);

    let json = tokio::fs::read_to_string("a.json").await?;
    let mut subtitle = Subtitle::from_transcribe_output(&json)?;
    subtitle.save_as_vtt("a.vtt").await?;
    subtitle.translate(&client, "en", "ko").await?;
    subtitle.save_as_srt("ko.a.srt").await?;
    subtitle.save_as_vtt("ko.a.vtt").await?;

    println!("{:?}", subtitle);

    Ok(())
}