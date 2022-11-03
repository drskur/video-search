use std::fs;
use lindera_tantivy::mode::{Mode, Penalty};
use lindera_tantivy::tokenizer::{DictionaryConfig, DictionaryKind, LinderaTokenizer, TokenizerConfig};
use tantivy::Index;
use tantivy::schema::{IndexRecordOption, Schema, STORED, STRING, TEXT, TextFieldIndexing, TextOptions};

pub fn ko_text_option() -> TextOptions {
    TextOptions::default()
        .set_indexing_options(
            TextFieldIndexing::default()
                .set_tokenizer("lang_ko")
                .set_index_option(IndexRecordOption::WithFreqsAndPositions)
        )
}

pub fn tantivy_en_schema() -> Schema {
    let mut schema_builder = Schema::builder();

    schema_builder.add_text_field("video_id", STRING | STORED);
    schema_builder.add_text_field("time", STRING | STORED);
    schema_builder.add_text_field("body", TEXT | STORED);
    schema_builder.build()
}

pub fn tantivy_ko_schema() -> Schema {
    let mut schema_builder = Schema::builder();

    schema_builder.add_text_field("video_id", STRING | STORED);
    schema_builder.add_text_field("time", STRING | STORED);
    schema_builder.add_text_field(
        "body",
        ko_text_option() | STORED
    );
    schema_builder.build()
}

pub fn tantivy_schema(lang: &str) -> Schema {
    if lang == "ko" {
        tantivy_ko_schema()
    } else {
        tantivy_en_schema()
    }
}

pub fn tantivy_index(mount: &str, lang: &str) -> anyhow::Result<Index> {

    let schema = tantivy_schema(lang);
    let index_path = &format!("{}/{}", mount, lang);
    fs::create_dir_all(index_path)?;
    let dir = tantivy::directory::MmapDirectory::open(index_path)?;
    let index = Index::open_or_create(dir, schema)?;
    if lang == "ko" {
        let config = TokenizerConfig {
            dictionary: DictionaryConfig {
                kind: Some(DictionaryKind::KoDic),
                path: None,
            },
            user_dictionary: None,
            mode: Mode::Decompose(Penalty::default()),
        };

        index.tokenizers()
            .register("lang_ko", LinderaTokenizer::with_config(config)?);
    }

    Ok(index)
}