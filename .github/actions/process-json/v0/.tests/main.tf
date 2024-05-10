/**
  This is a test file to enable local testing of terrform output JSON SCHEMA
  --> in this directory run 
  $ terraform init 
  $ terraform apply 
  $ terraform output -json
*/

locals {
  simple = "some-id"
  complex1Level = {
        key1: "complex1Level"
        key2: 123
        key3: false
  }
  complex2Level = {
    key1: {
        c2l_key1: "complex2Level"
        c2l_key2: 123
        c2l_key3: false
    }
  }
  complex2Level_arr = {
    key1: {
       c2larr_key1: ["i1", "i2"]
       c2larr_key2: 123
       c2larr_key3: false
    }
  }
}

output "simple" {
  value = local.simple
}

output "complex1Level" {
  value = local.complex1Level
}

output "complex2Level" {
  value = local.complex2Level
}

output "complex2Level_arr" {
  value = local.complex2Level_arr
}

output "arr1" {
  sensitive = true
  value = ["item1", "item2"]
}
