# andasy.hcl app configuration file generated for tresore-commerce on Wednesday, 15-Apr-26 10:32:08 CAT
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "tresore-commerce"

app {

  env = {
    PORT=5000
# DATABASE
MONGO_URL="mongodb+srv://tresormugisha07_db_user:ZhtjO5bEpAtwhgNW@cluster0.krtk2sk.mongodb.net/?appName=Cluster0"

# SECRET
JWT_SECRET="REPLACE_WITH_STRONG_SECRET_RUN_openssl_rand_hex_32"
ADMIN_PASS="klab@2026"
ADMIN_EMAIL="admin@bdifferent.com"
ADMIN_USERNAME="admin"
EXPIRATION_TOKEN="1d"
SALT_ROUNDS="12"

# CLOUDINARY
CLOUDINARY_CLOUD_NAME="dvm7ocouc"
CLOUDINARY_API_KEY="492548582171892"
CLOUDINARY_API_SECRET="a7b1bBUdr6tc_alU_qdZrZrLqCk"

# EMAIL
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="tresormugisha07@gmail.com"
EMAIL_PASSWORD="xadnvczsubuhlrbz"
EMAIL_FROM="tresormugisha07@gmail.com"
RESEND_API_KEY="re_hT7wFSyQ_KRk4DEsc84xxZtMEBs7JfCQZ"

# PAYMENT
FLW_PUBLIC_KEY="FLWPUBK_TEST-99cd7ec0664c183d32a499daf95fc679-X"
FLW_SECRET_KEY="FLWSECK_TEST-a099f130d90138f2b541a9944a062bae-X"
FLW_SECRET_HASH="REPLACE_WITH_YOUR_FLUTTERWAVE_SECRET_HASH"
FLW_BASE_URL="https://api.flutterwave.com/v3"
FLW_REDIRECT_URL="REPLACE_WITH_YOUR_PRODUCTION_URL/payment/callback"
  }

  port = 5000

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
