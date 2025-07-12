fn main() {
    // Set SQLX_OFFLINE to true if not already set
    if std::env::var("SQLX_OFFLINE").is_err() {
        println!("cargo:rustc-env=SQLX_OFFLINE=true");
    }

    println!("cargo:rerun-if-env-changed=SQLX_OFFLINE");

    if std::env::var("SQLX_OFFLINE").unwrap_or_default() == "true" {
        println!("cargo:rustc-cfg=sqlx_offline");
    }
    println!("BUILD.RS: Build script completed!");
}
