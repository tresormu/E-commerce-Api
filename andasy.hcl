# andasy.hcl app configuration file generated for tresore-commerce on Wednesday, 15-Apr-26 10:32:08 CAT
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "tresore-commerce"

app {

  env = {}

  port = 8080

  primary_region = "fsn"

  compute {
    cpu      = 1
    memory   = 256
    cpu_kind = "shared"
  }

  process {
    name = "tresore-commerce"
  }

}
