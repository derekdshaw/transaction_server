use dotenv::dotenv;
use std::env;

pub struct Config;

impl Config {
    /// Initialize configuration by loading environment variables
    pub fn init() {
        // Try to load .env.local first
        if dotenv::from_path(".env.local").is_err() {
            // If .env.local doesn't exist, try .env
            dotenv().ok();
        }
    }

    /// Get a required environment variable
    pub fn get_env_var(key: &str) -> Result<String, String> {
        env::var(key).map_err(|_| format!("Environment variable {} is not set", key))
    }

    /// Get an optional environment variable with a default value
    pub fn get_env_var_with_default(key: &str, default: &str) -> String {
        env::var(key).unwrap_or_else(|_| default.to_string())
    }
}
