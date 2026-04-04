app_name = "ecommerceone"

app {
  env = {}

  port = 9000

  primary_region = "fsn"

  compute {
    cpu      = 1
    memory   = 256
    cpu_kind = "shared"
  }

  process {
    name = "ecommerceone"
  }
}
