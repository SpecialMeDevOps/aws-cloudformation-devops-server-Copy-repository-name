#!/usr/bin/env bash
set -euo pipefail

readonly kubectl_version='v1.34.0'
readonly helm_version='v3.17.3'
readonly install_dir="${WORKSPACE}@tmp/ci-tools/bin"
readonly arch="$(uname -m)"

case "$arch" in
  x86_64)
    readonly kubectl_arch='amd64'
    readonly kubectl_sha256='cfda68cba5848bc3b6c6135ae2f20ba2c78de20059f68789c090166d6abc3e2c'
    readonly helm_arch='amd64'
    readonly helm_sha256='ee88b3c851ae6466a3de507f7be73fe94d54cbf2987cbaa3d1a3832ea331f2cd'
    ;;
  aarch64|arm64)
    readonly kubectl_arch='arm64'
    readonly kubectl_sha256='00b182d103a8a73da7a4d11e7526d0543dcf352f06cc63a1fde25ce9243f49a0'
    readonly helm_arch='arm64'
    readonly helm_sha256='7944e3defd386c76fd92d9e6fec5c2d65a323f6fadc19bfb5e704e3eee10348e'
    ;;
  *)
    printf 'Unsupported Jenkins agent architecture: %s\n' "$arch" >&2
    exit 2
    ;;
esac

command -v curl >/dev/null
command -v sha256sum >/dev/null
command -v tar >/dev/null
mkdir -p "$install_dir"

if ! kubectl version --client --output=json 2>/dev/null \
  | jq -e --arg version "${kubectl_version#v}" '.clientVersion.gitVersion == ("v" + $version)' >/dev/null; then
  kubectl_archive="$(mktemp)"
  trap 'rm -f "$kubectl_archive"' EXIT
  curl --fail --silent --show-error --location \
    "https://dl.k8s.io/release/${kubectl_version}/bin/linux/${kubectl_arch}/kubectl" \
    --output "$kubectl_archive"
  printf '%s  %s\n' "$kubectl_sha256" "$kubectl_archive" | sha256sum --check --status
  install -m 0755 "$kubectl_archive" "$install_dir/kubectl"
  rm -f "$kubectl_archive"
  trap - EXIT
fi

if ! helm version --template '{{.Version}}' 2>/dev/null | grep -Fxq "$helm_version"; then
  helm_archive="$(mktemp)"
  helm_extract_dir="$(mktemp -d)"
  trap 'rm -f "$helm_archive"; rm -rf "$helm_extract_dir"' EXIT
  curl --fail --silent --show-error --location \
    "https://get.helm.sh/helm-${helm_version}-linux-${helm_arch}.tar.gz" \
    --output "$helm_archive"
  printf '%s  %s\n' "$helm_sha256" "$helm_archive" | sha256sum --check --status
  tar -xzf "$helm_archive" -C "$helm_extract_dir" "linux-${helm_arch}/helm"
  install -m 0755 "$helm_extract_dir/linux-${helm_arch}/helm" "$install_dir/helm"
  rm -f "$helm_archive"
  rm -rf "$helm_extract_dir"
  trap - EXIT
fi

kubectl version --client --output=json \
  | jq -e --arg version "${kubectl_version#v}" '.clientVersion.gitVersion == ("v" + $version)' >/dev/null
helm version --template '{{.Version}}' | grep -Fx "$helm_version" >/dev/null
printf 'Verified kubectl %s and Helm %s for linux/%s.\n' "$kubectl_version" "$helm_version" "$arch"
