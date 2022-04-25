use lindera_tantivy::mode::{Mode, Penalty};
use lindera_tantivy::tokenizer::{DictionaryType, LinderaTokenizer, TokenizerConfig, UserDictionaryType};
use tantivy::{doc, Index, Snippet, SnippetGenerator};
use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;
use tantivy::schema::{IndexRecordOption, Schema, TextFieldIndexing, TextOptions};

fn main() -> tantivy::Result<()> {
    let mut schema_builder = Schema::builder();

    let id = schema_builder.add_text_field(
        "id",
        TextOptions::default()
            .set_indexing_options(
                TextFieldIndexing::default()
                    .set_tokenizer("raw")
                    .set_index_option(IndexRecordOption::Basic)
            )
            .set_stored(),
    );

    let title = schema_builder.add_text_field(
        "title",
        TextOptions::default()
            .set_indexing_options(
                TextFieldIndexing::default()
                    .set_tokenizer("lang_ko")
                    .set_index_option(IndexRecordOption::WithFreqsAndPositions)
            )
            .set_stored()
    );

    let body = schema_builder.add_text_field(
        "body",
        TextOptions::default()
            .set_indexing_options(
                TextFieldIndexing::default()
                    .set_tokenizer("lang_ko")
                    .set_index_option(IndexRecordOption::WithFreqsAndPositions)
            )
            .set_stored()
    );

    let schema = schema_builder.build();

    // let index = Index::create_in_dir("i", schema.clone())?;

    let index = Index::open_in_dir("i")?;

    let config = TokenizerConfig {
        dict_type: DictionaryType::KoDic,
        dict_path: None,
        user_dict_path: None,
        user_dict_type: UserDictionaryType::Csv,
        mode: Mode::Decompose(Penalty::default())
    };

    index.tokenizers()
        .register("lang_ko", LinderaTokenizer::with_config(config).unwrap());

    // let mut w = index.writer(50_000_000)?;
    //
    // w.add_document(doc!(
    //     id => "3",
    //     title => "Jamie's Quick & Easy Egg Fried Rice _ Jamie Oliver",
    //     body => "WEBVTT\n\n00:00:00.340 --> 00:00:02.520\n들어봐, 앞으로 몇 달 동안 여기 있을게요\n\n00:00:02.530 --> 00:00:03.970\n잘게 썰어 아래로 밀어 넣습니다.\n\n00:00:03.980 --> 00:00:05.510\n어떻게 해야 할지에 대한 단서가 없습니다.\n\n00:00:05.520 --> 00:00:06.659\n우리는 우리 자신을 가져와야 합니다.\n\n00:00:07.039 --> 00:00:09.810\n네, 그게 바로 그것입니다.\n\n00:00:09.819 --> 00:00:10.630\n그렇게 비틀어\n\n00:00:10.630 --> 00:00:11.979\n정말 좋은 때리기를 줘.\n\n00:00:12.260 --> 00:00:12.829\n완벽한\n\n00:00:12.829 --> 00:00:13.560\n조금 기다리고 있어요.\n\n00:00:16.540 --> 00:00:18.809\n계란 볶음밥.\n\n00:00:18.819 --> 00:00:20.440\n절대적인 클래식입니다.\n\n00:00:20.450 --> 00:00:23.530\n그리고 나는 당신을 위해 매우 일관되고 맛있는 요리법을 가지고 있습니다.\n\n00:00:23.530 --> 00:00:24.260\n빠르고 쉽습니다.\n\n00:00:24.270 --> 00:00:27.489\n따라서 고열로 큰 냄비부터 시작하십시오.\n\n00:00:27.500 --> 00:00:32.099\n그리고 여기에 6 개의 아름다운 부추가 있습니다.\n\n00:00:32.740 --> 00:00:35.119\n이 레시피를 만드는 것을 좋아합니다.\n\n00:00:35.130 --> 00:00:36.860\n네, 반찬으로 할 수 있습니다.\n\n00:00:36.869 --> 00:00:38.090\n전혀 문제 없습니다.\n\n00:00:38.240 --> 00:00:42.950\n하지만 실제로는 정말 아름다운 저녁 식사로 향하고 있습니다.\n\n00:00:42.959 --> 00:00:44.580\n마지막으로 슬라이스합니다.\n\n00:00:44.590 --> 00:00:54.849\n이 냄비의 맛이 좋고 뜨거워지면 올리브 오일 한 스푼을 넣고 양파를 똑바로 넣으면 바로 구울 수 있습니다.\n\n00:00:55.340 --> 00:00:58.099\n그리고 밥 몇 봉지를 가지고 있습니다.\n\n00:00:58.110 --> 00:00:58.500\n예\n\n00:00:58.509 --> 00:01:01.310\n흰 쌀은 12 분 동안 직접 요리 할 수 있습니다.\n\n00:01:01.340 --> 00:01:04.459\n그러나 볶음밥을 저어 주려면 물기를 빼고 식혀 야합니다.\n\n00:01:04.489 --> 00:01:06.800\n뜨거운 밥은 볶을 수 없습니다.\n\n00:01:07.080 --> 00:01:10.760\n이렇게 조리된 지름길은 빨간 볶음밥이 굳어지지\n\n00:01:11.239 --> 00:01:13.699\n그래서 저에게는 값싼 것 같은 느낌이 듭니다.\n\n00:01:13.709 --> 00:01:15.129\n지글지글 소리가 들린다.\n\n00:01:15.139 --> 00:01:18.069\n알다시피, 우리는 약간 흔들고 있기 때문에 빠릅니다.\n\n00:01:18.080 --> 00:01:18.819\n더워요.\n\n00:01:18.830 --> 00:01:19.669\n분노합니다.\n\n00:01:19.790 --> 00:01:21.650\n우리가 던질 거예요, 그렇죠?\n\n00:01:21.660 --> 00:01:22.779\n다음과 같은 성분입니다.\n\n00:01:22.809 --> 00:01:24.779\n이제 집에서 항상 칠리 잼을 먹습니다.\n\n00:01:24.779 --> 00:01:25.970\n요리에 좋습니다.\n\n00:01:25.980 --> 00:01:32.279\n열이 있지만 단맛도 있습니다. 유약과 같아서 맛의 균형을 맞추는 데 도움이됩니다.\n\n00:01:32.290 --> 00:01:45.279\n그래서 스튜 냄비에 두 티스푼을 넣고 다시 던지기 시작하자마자 모든 쌀알이 코팅되어 가장 아름답게 빛납니다.\n\n00:01:45.290 --> 00:01:55.980\n그리고이 단계에서 쌀을 통통하게 만들려면 약간의 물을 부으십시오.\n\n00:01:55.989 --> 00:02:00.660\n밥을 냄비 옆으로 똑바로 밀고 가운데로 똑바로 밀기 만하면됩니다.\n\n00:02:01.139 --> 00:02:04.250\n아름다운 방목 달걀을 두 개로 나누자\n\n00:02:07.540 --> 00:02:14.929\n달걀 흰자와 노른자를 정말 축하합니다. 계란 후라이처럼 먹고 깨뜨려 대리석으로 만들고 싶기 때문입니다.\n\n00:02:15.160 --> 00:02:20.369\n그리고 마지막 재료가 필요할 때입니다.다시 말하지만, 많은 사람들에게 이것은 약간의 새로운 성분입니다.\n\n00:02:20.380 --> 00:02:23.399\n두부는 단단한 부드러운 두부입니다.\n\n00:02:23.440 --> 00:02:24.270\n단백질입니다.\n\n00:02:24.270 --> 00:02:25.509\n기본적으로 대두로 만들어져 있습니다.\n\n00:02:25.509 --> 00:02:26.949\n아주 건강합니다.\n\n00:02:27.440 --> 00:02:28.949\n여기 뭐가 있는지 보여드릴게요.\n\n00:02:28.960 --> 00:02:32.460\n결국 그것은 작은 두부 조각처럼 보입니다.\n\n00:02:32.550 --> 00:02:42.149\n그 중 절반은 약 150g이 필요합니다. 당신이 할 수있는 일은 이것을 깨고 일단 익히면 밥을 다시 가져 오는 것입니다.\n\n00:02:42.160 --> 00:02:47.149\n하지만 두부 덩어리를 원하고 조금 원하고 계란 덩어리를 원하고 조금 원합니다.\n\n00:02:47.160 --> 00:02:54.460\n이 단계 볶음밥의 좋은 점은 약간의 소금을 넣은 무작위 계절입니다.\n\n00:02:55.039 --> 00:02:58.750\n조금 던지고 모든 것을 섞으면 봉사 할 준비가 된 것입니다.\n\n00:03:00.839 --> 00:03:05.660\n그릇을 가져다가 그릇 주위에 약간의 기름을 넣고 문지릅니다.\n\n00:03:06.639 --> 00:03:10.570\n기본적으로 모래 성을 만들려고하는데 볶음밥으로 만들겠습니다.\n\n00:03:10.600 --> 00:03:16.869\n여기에 얼음을 붓고 볶음밥과 길거리 음식을 저어 주면 아름답습니다.\n\n00:03:17.039 --> 00:03:18.690\n종종 건강에 해로운 것과 관련이 있습니다.\n\n00:03:18.690 --> 00:03:23.559\n건강을 위해 만들어졌으므로 아래로 밀면 바꿀 준비가 된 것입니다.\n\n00:03:23.940 --> 00:03:24.960\n접시 하나 가져갈게요\n\n00:03:25.339 --> 00:03:27.860\n약간의 압력을 가하고 위에 올려 놓으십시오.\n\n00:03:28.240 --> 00:03:29.119\n그것을 올리십시오\n\n00:03:29.130 --> 00:03:30.250\n그냥 맘에 들어요\n\n00:03:32.740 --> 00:03:33.250\n예\n\n00:03:33.740 --> 00:03:33.940\n네.\n\n00:03:34.339 --> 00:03:35.229\n그래서 거기 가세요.\n\n00:03:35.240 --> 00:03:35.899\n정말 멋지네요\n\n00:03:35.899 --> 00:03:37.699\n볶음밥을 두 사람과 함께 저어주세요.\n\n00:03:37.830 --> 00:03:39.110\n그리고 당신은 그것을 편으로 가질 수 있습니다.\n\n00:03:39.110 --> 00:03:40.100\n식사로 먹어도 괜찮습니다.\n\n00:03:40.110 --> 00:03:42.220\n지금이 맛을 맛볼 때라고 생각합니다.\n\n00:03:42.229 --> 00:03:46.619\n그리고 모든 좋은 모래 성들처럼, 어느 시점에서 누군가가 와서 파괴해야 합니다.\n\n00:03:46.630 --> 00:03:53.869\n이 경우 저와 저는 털이 많고 육즙이 많은 코트 달걀 전체를 좋아합니다.\n\n00:03:55.139 --> 00:03:57.070\n흠, 정말 아름다워요.\n\n00:03:57.320 --> 00:03:58.220\n거기에는 더위가 있어요.\n\n00:03:58.380 --> 00:04:03.000\n양파는 여전히 쫄깃하고 두부는 매우 부드럽고 맛있습니다.\n\n00:04:03.009 --> 00:04:03.960\n멋져 보이네요\n\n00:04:05.440 --> 00:04:10.860\n그리고 mhm mhm mhm을 만드는 것은 정말 재미 있습니다.\n\n"
    // ))?;
    //
    // w.add_document(doc!(
    //     id => "2",
    //     title => "플라넬 드립 라떼 여러분",
    //     body => "융 드립으로 원두의 바디감을 살린 정통 핸드드립방식"
    // ))?;
    //
    // w.commit()?;

    let r = index.reader()?;

    let s = r.searcher();

    let p = QueryParser::for_index(&index, vec![body]);

    let q = "냄비";
    let query = p.parse_query(q)?;

    let top_docs = s.search(&query, &TopDocs::with_limit(2))?;

    let mut snippet_generator = SnippetGenerator::create(&s, &*query, body)?;
    snippet_generator.set_max_num_chars(300);

    println!("Search Result:");
    for (score, doc_address) in top_docs {
        let doc = s.doc(doc_address)?;
        let snippet = snippet_generator.snippet_from_doc(&doc);
        println!("Document score {}:", score);
        println!(
            "title: {}",
            doc.get_first(title).unwrap().as_text().unwrap()
        );
        println!("snippet: {}", snippet.to_html());
        println!("custom highlighting: {}", highlight(snippet));
    }


    Ok(())
}

fn highlight(snippet: Snippet) -> String {
    let mut result = String::new();
    let mut start_from = 0;

    for fragment_range in snippet.highlighted() {
        result.push_str(&snippet.fragment()[start_from..fragment_range.start]);
        result.push_str(" --> ");
        result.push_str(&snippet.fragment()[fragment_range.clone()]);
        result.push_str(" <-- ");
        start_from = fragment_range.end;
    }

    result.push_str(&snippet.fragment()[start_from..]);
    result
}