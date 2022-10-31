all: s3-put-object-trigger dist

s3-put-object-trigger:
	cargo lambda build --release --bin s3-put-object-trigger --target aarch64-unknown-linux-gnu

dist:
	mkdir -p ./.dist
	cp -r target/lambda/* ./.dist/
	ls -al ./.dist/