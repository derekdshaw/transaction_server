#[macro_export]
macro_rules! assert_scalar_value {
    ($obj:expr, $field:literal, $ty:ty, $expected_val:expr, $context:expr) => {
        assert_eq!(
            $obj.get_field_value($field)
                .and_then(|v| v.as_scalar_value::<$ty>()),
            Some(&$expected_val),
            "Mismatch on field '{}' in {}", $field, $context
        );
    };
}

#[macro_export]
macro_rules! assert_optional_scalar_value {
    ($obj:expr, $field:literal, $ty:ty, $expected_opt:expr, $context:expr) => {
        match &$expected_opt {
            Some(val) => {
                assert_eq!(
                    $obj.get_field_value($field)
                        .and_then(|v| v.as_scalar_value::<$ty>()),
                    Some(val),
                    "Mismatch on optional field '{}' in {}", $field, $context
                );
            }
            None => {
                let field_val = $obj.get_field_value($field);
                assert!(
                    field_val.is_none() || matches!(field_val, Some(juniper::Value::Null)),
                    "Expected optional field '{}' to be null or missing in {}", $field, $context
                );
            }
        }
    };
}

#[macro_export]
macro_rules! assert_object_fields {
    (
        $obj:expr,
        $field_name:expr,
        $expected_vec:expr,
        $assert_fn:ident
    ) => {{
        use juniper::Value;

        let obj = match $obj {
            Value::Object(ref o) => o,
            _ => panic!("Expected top-level Value::Object"),
        };

        let field_value = obj
            .get_field_value($field_name)
            .expect(concat!("Missing field: ", $field_name));

        let object_values = match field_value {
            Value::Object(_) => vec![field_value],
            Value::List(list) => list.iter().collect(),
            _ => panic!("Unexpected value type for field '{}'", $field_name),
        };

        assert_eq!(
            object_values.len(),
            $expected_vec.len(),
            "Mismatch: {} actual vs {} expected items",
            object_values.len(),
            $expected_vec.len()
        );

        for (i, (value, expected)) in object_values.iter().zip($expected_vec.iter()).enumerate() {
            let obj_val = value
                .as_object_value()
                .expect(&format!("Item {} is not a valid object", i));
            $assert_fn(obj_val, expected, i);
        }
    }};
}
