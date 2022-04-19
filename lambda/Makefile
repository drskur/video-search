all: index transcribe dist
index:
	cargo lambda build --release --bin index --target aarch64-unknown-linux-gnu

transcribe:
	cargo lambda build --release --bin transcribe --target aarch64-unknown-linux-gnu

dist:
	mkdir -p ../.dist
	cp -r target/lambda/ ../.dist/