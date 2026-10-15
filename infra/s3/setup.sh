#!/bin/bash
# infra/s3/setup.sh: create (or re-apply settings to) the curate-motion library bucket. Idempotent.
#   private (Block Public Access, all four), SSE-S3 default encryption, versioning on,
#   non-current versions expire after 90 days, TLS-only policy, tag project=curate-motion.
set -euo pipefail
cd "$(dirname "$0")"
REGION=${CURATE_MOTION_REGION:-us-east-1}
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
BUCKET=${CURATE_MOTION_BUCKET:-curate-motion-library-$ACCOUNT}
A="--region $REGION"

if aws s3api head-bucket --bucket "$BUCKET" $A 2>/dev/null; then
  echo "bucket $BUCKET exists; re-applying settings"
else
  # us-east-1 takes no LocationConstraint
  aws s3api create-bucket --bucket "$BUCKET" --object-ownership BucketOwnerEnforced $A >/dev/null
  aws s3api wait bucket-exists --bucket "$BUCKET" $A
  echo "created $BUCKET"
fi
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration file://public-access-block.json $A
aws s3api put-bucket-encryption --bucket "$BUCKET" --server-side-encryption-configuration file://encryption.json $A
aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled $A
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET" --lifecycle-configuration file://lifecycle.json $A
sed "s/BUCKET/$BUCKET/g" policy.template.json > /tmp/curate-motion-policy.json
aws s3api put-bucket-policy --bucket "$BUCKET" --policy file:///tmp/curate-motion-policy.json $A
rm -f /tmp/curate-motion-policy.json
aws s3api put-bucket-tagging --bucket "$BUCKET" --tagging 'TagSet=[{Key=project,Value=curate-motion},{Key=owner,Value=curate-marketing},{Key=data,Value=media-library}]' $A
echo "--- verify"
aws s3api get-public-access-block --bucket "$BUCKET" $A --output json
aws s3api get-bucket-versioning --bucket "$BUCKET" $A --output json
aws s3api get-bucket-encryption --bucket "$BUCKET" $A --query 'ServerSideEncryptionConfiguration.Rules[0]' --output json
aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET" $A --query 'Rules[].ID' --output json
aws s3api get-bucket-tagging --bucket "$BUCKET" $A --output json
aws s3api get-bucket-policy-status --bucket "$BUCKET" $A --output json
