def isMainBranchBuild() {
  def branchName = env.BRANCH_NAME ?: env.GIT_BRANCH ?: env.GIT_LOCAL_BRANCH ?: ''
  return ['main', 'origin/main', 'refs/remotes/origin/main'].contains(branchName)
}

pipeline {
  agent any

  parameters {
    choice(
      name: 'TRIVY_FAIL_ON_SEVERITY',
      choices: ['HIGH,CRITICAL', 'CRITICAL', 'MEDIUM,HIGH,CRITICAL', 'LOW,MEDIUM,HIGH,CRITICAL'],
      description: 'Lowest Trivy severity that fails a scan. Defaults to HIGH,CRITICAL.'
    )
    booleanParam(
      name: 'DEPLOY_TO_AWS',
      defaultValue: false,
      description: 'Enable the approved AWS infrastructure, ECR, EKS, and monitoring workflow on main.'
    )
    string(
      name: 'KUBERNETES_OPERATOR_PRINCIPAL_ARN',
      defaultValue: '',
      trim: true,
      description: 'IAM user or role ARN that will use kubectl port-forward. Must be in the deployment AWS account.'
    )
    string(
      name: 'KUBERNETES_API_ACCESS_CIDRS',
      defaultValue: '',
      trim: true,
      description: 'Comma-separated trusted IPv4 CIDRs for kubectl clients. Jenkins egress is added automatically; do not use /0.'
    )
    string(
      name: 'KUBERNETES_VERSION',
      defaultValue: '1.34',
      trim: true,
      description: 'Supported EKS Kubernetes minor version.'
    )
  }

  tools {
    nodejs 'NodeJS-22'
  }

  environment {
    PATH = "${env.WORKSPACE}@tmp/ci-tools/bin:${env.PATH}"
    NODE_ENV = 'test'
    APP_NAME = 'it-your-it-house'
    AWS_REGION = 'us-east-1'
    TF_VAR_aws_region = 'us-east-1'
    TRIVY_VERSION = '0.76.0'
    TRIVY_FAIL_ON_SEVERITY = "${params.TRIVY_FAIL_ON_SEVERITY}"
    TRIVY_HOME = "${WORKSPACE}@tmp/trivy-${BUILD_NUMBER}"
    TF_VAR_project_name = 'it-your-it-house'
    TF_VAR_environment = 'dev'
    TF_VAR_deploy_application = 'false'
    K8S_APP_NAMESPACE = 'it-your-it-house-dev'
    TRIVY_IMAGE_FAIL_ON_SEVERITY = 'CRITICAL'
  }

  options {
    timestamps()
    timeout(time: 120, unit: 'MINUTES')
    disableConcurrentBuilds()
    skipDefaultCheckout(false)
  }

  stages {
    stage('Checkout') {
      steps {
        echo "Checking out commit ${env.GIT_COMMIT ?: 'unknown'} on branch ${env.BRANCH_NAME ?: env.GIT_BRANCH ?: env.GIT_LOCAL_BRANCH ?: 'unknown'}"
      }
    }

    stage('CI Agent Preflight') {
      steps {
        sh 'bash scripts/install-ci-tools.sh'
        sh 'ansible-playbook -i localhost, ansible/playbooks/preflight.yml'
      }
    }

    stage('Infrastructure Syntax Validation') {
      steps {
        sh '''
          set -eu
          terraform -chdir=terraform fmt -check -recursive
          for playbook in ansible/playbooks/*.yml; do
            ansible-playbook --syntax-check -i ansible/inventory/hosts.example "$playbook"
          done
        '''
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'npm ci'
        sh 'cd backend && npm ci --legacy-peer-deps'
      }
    }

    stage('Validation') {
      steps {
        sh 'node --version'
        sh 'npm --version'
        sh 'npm run lint'
        sh 'npx tsc --noEmit'
        sh 'cd backend && npm run lint'
        sh 'cd backend && npx tsc --noEmit'
      }
    }

    stage('Prisma Validation') {
      environment {
        DATABASE_URL = 'postgresql://ci_user:ci_password@localhost:5432/ci_validation?schema=public'
      }
      steps {
        sh 'cd backend && npx prisma generate'
        sh 'cd backend && npx prisma validate'
      }
    }

    stage('Testing') {
      steps {
        sh 'npm run test'
        sh 'cd backend && npm test'
      }
    }

    stage('SAST') {
      steps {
        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE', message: 'Semgrep SAST reported findings or could not complete.') {
          sh '''
            set -eu
            mkdir -p reports/semgrep
            docker run --rm semgrep/semgrep:1.181.0 semgrep --version \
              | tee reports/semgrep/semgrep-version.txt
            grep -F '1.181.0' reports/semgrep/semgrep-version.txt >/dev/null
            docker run --rm \
              --volume "$WORKSPACE:/src" \
              --workdir /src \
              semgrep/semgrep:1.181.0 \
              semgrep scan --config p/ci --json --output reports/semgrep/semgrep.json --error .
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'reports/semgrep/**', allowEmptyArchive: true
        }
      }
    }

    stage('Dependency Security') {
      steps {
        sh 'mkdir -p reports/dependency-audit'
        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE', message: 'Frontend dependency audit reported critical findings or could not complete.') {
          sh 'npm audit --audit-level=critical --json > reports/dependency-audit/frontend.json'
        }
        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE', message: 'Backend dependency audit reported critical findings or could not complete.') {
          sh 'cd backend && npm audit --audit-level=critical --json > ../reports/dependency-audit/backend.json'
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'reports/dependency-audit/**', allowEmptyArchive: true
        }
      }
    }

    stage('Trivy Filesystem, Secret, and Infrastructure Scans') {
      steps {
        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE', message: 'Trivy filesystem, secret, or infrastructure scanning failed or crossed the configured severity threshold.') {
          sh '''
            set -eu

            mkdir -p "$TRIVY_HOME" reports/trivy
            case "$(uname -s)" in
              Linux) trivy_os="Linux" ;;
              *) echo "Pinned Trivy installation supports Linux agents only." >&2; exit 2 ;;
            esac
            case "$(uname -m)" in
              x86_64|amd64) trivy_arch="64bit" ;;
              aarch64|arm64) trivy_arch="ARM64" ;;
              *) echo "Unsupported Trivy agent architecture: $(uname -m)" >&2; exit 2 ;;
            esac

            archive="trivy_${TRIVY_VERSION}_${trivy_os}-${trivy_arch}.tar.gz"
            release_url="https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}"
            curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
              --output "$TRIVY_HOME/$archive" "$release_url/$archive"
            curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
              --output "$TRIVY_HOME/checksums.txt" "$release_url/trivy_${TRIVY_VERSION}_checksums.txt"
            grep -E "^[[:xdigit:]]{64}  ${archive}$" "$TRIVY_HOME/checksums.txt" \
              | (cd "$TRIVY_HOME" && sha256sum --check --status)
            tar -xzf "$TRIVY_HOME/$archive" -C "$TRIVY_HOME" trivy
            trivy="$TRIVY_HOME/trivy"
            "$trivy" --version | tee reports/trivy/trivy-version.txt
            grep -F "Version: ${TRIVY_VERSION}" reports/trivy/trivy-version.txt >/dev/null

            "$trivy" fs --quiet --scanners vuln --severity CRITICAL,HIGH,MEDIUM,LOW \
              --format json --output reports/trivy/filesystem-vulnerabilities.json .
            jq -r '
              .Results[]? | .Vulnerabilities[]? |
              [.Severity, .VulnerabilityID, .PkgName, .InstalledVersion, (.FixedVersion // "no known fix")] | @tsv
            ' reports/trivy/filesystem-vulnerabilities.json > reports/trivy/filesystem-vulnerabilities.txt

            "$trivy" config --quiet \
              --severity CRITICAL,HIGH,MEDIUM,LOW \
              --format json --output reports/trivy/infrastructure-misconfigurations.json .
            jq -r '
              .Results[]? as $result | $result.Misconfigurations[]? |
              [.Severity, .ID, $result.Target, .CauseMetadata.StartLine, .Title, .CauseMetadata.Resource] | @tsv
            ' reports/trivy/infrastructure-misconfigurations.json > reports/trivy/infrastructure-misconfigurations.txt

            "$trivy" fs --quiet --scanners secret --severity CRITICAL,HIGH,MEDIUM,LOW \
              --format template --template "@ci/trivy-secret-report.tpl" \
              --output reports/trivy/secrets-redacted.txt .
            "$trivy" fs --quiet --scanners secret --severity CRITICAL,HIGH,MEDIUM,LOW \
              --format json --output "$TRIVY_HOME/secrets-private.json" .

            threshold_count() {
              jq --arg threshold "$TRIVY_FAIL_ON_SEVERITY" \
                '[.Results[]? | (.Vulnerabilities[]?, .Misconfigurations[]?) |
                  select(.Severity as $severity | ($threshold | split(",")) | index($severity))] | length' "$1"
            }
            vulnerability_count="$(threshold_count reports/trivy/filesystem-vulnerabilities.json)"
            today_utc="$(date -u +%Y%m%d)"
            api_exception_active=false
            encryption_exception_active=false
            if [ "$today_utc" -lt 20270117 ]; then
              api_exception_active=true
            fi
            if [ "$today_utc" -lt 20271017 ]; then
              encryption_exception_active=true
            fi
            config_count="$(jq --arg threshold "$TRIVY_FAIL_ON_SEVERITY" \
              --arg api_exception_active "$api_exception_active" \
              --arg encryption_exception_active "$encryption_exception_active" '
              [
                .Results[]? as $result | $result.Misconfigurations[]? |
                select(.Severity as $severity | ($threshold | split(",")) | index($severity)) |
                select(
                  !(($result.Target == "cloudformation/application-stack.yaml") and
                    (.ID == "AWS-0039") and
                    ($encryption_exception_active == "true")) and
                  !(($result.Target == "cloudformation/application-stack.yaml") and
                    (.ID == "AWS-0040") and
                    ($api_exception_active == "true"))
                )
              ] | length
            ' reports/trivy/infrastructure-misconfigurations.json)"
            accepted_config_count="$(jq --arg threshold "$TRIVY_FAIL_ON_SEVERITY" \
              --arg api_exception_active "$api_exception_active" \
              --arg encryption_exception_active "$encryption_exception_active" '
              [
                .Results[]? as $result | $result.Misconfigurations[]? |
                select(.Severity as $severity | ($threshold | split(",")) | index($severity)) |
                select(
                  (($result.Target == "cloudformation/application-stack.yaml") and
                   (.ID == "AWS-0039") and
                   ($encryption_exception_active == "true")) or
                  (($result.Target == "cloudformation/application-stack.yaml") and
                   (.ID == "AWS-0040") and
                   ($api_exception_active == "true"))
                )
              ] | length
            ' reports/trivy/infrastructure-misconfigurations.json)"
            secret_count="$(jq --arg threshold "$TRIVY_FAIL_ON_SEVERITY" \
              '[.Results[]? | .Secrets[]? |
                select(.Severity as $severity | ($threshold | split(",")) | index($severity))] | length' \
              "$TRIVY_HOME/secrets-private.json")"
            rm -f -- "$TRIVY_HOME/secrets-private.json"

            printf 'Threshold %s: filesystem=%s actionable-config=%s accepted-config-exceptions=%s secrets=%s\\n' \
              "$TRIVY_FAIL_ON_SEVERITY" "$vulnerability_count" "$config_count" "$accepted_config_count" "$secret_count"
            if [ "$accepted_config_count" -gt 0 ]; then
              printf 'Time-limited, documented EKS config exceptions: AWS-0039 (EKS 1.28+ AWS-owned-key encryption; review by 2027-10-17), AWS-0040 (IAM-authenticated API allowlisted to Jenkins/operator CIDRs; review by 2027-01-17).\\n'
            fi
            if [ "$vulnerability_count" -gt 0 ] || [ "$config_count" -gt 0 ] || [ "$secret_count" -gt 0 ]; then
              if [ "$vulnerability_count" -gt 0 ]; then
                echo 'Filesystem findings (severity, CVE, target, package, title):'
                jq -r --arg threshold "$TRIVY_FAIL_ON_SEVERITY" '
                  .Results[]? as $result | $result.Vulnerabilities[]? |
                  select(.Severity as $severity | ($threshold | split(",")) | index($severity)) |
                  [.Severity, .VulnerabilityID, $result.Target, .PkgName, .Title] | @tsv
                ' reports/trivy/filesystem-vulnerabilities.json
              fi
              if [ "$config_count" -gt 0 ]; then
                echo 'Infrastructure findings (severity, ID, target, line, title):'
                jq -r --arg threshold "$TRIVY_FAIL_ON_SEVERITY" '
                  .Results[]? as $result | $result.Misconfigurations[]? |
                  select(.Severity as $severity | ($threshold | split(",")) | index($severity)) |
                  [.Severity, .ID, $result.Target, (.CauseMetadata.StartLine // 0), .Title] | @tsv
                ' reports/trivy/infrastructure-misconfigurations.json
              fi
              if [ "$secret_count" -gt 0 ]; then
                echo 'Secret findings (values omitted):'
                cat reports/trivy/secrets-redacted.txt
              fi
              exit 1
            fi
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'reports/trivy/**', allowEmptyArchive: true
        }
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
        sh 'cd backend && npm run build'
      }
    }

    stage('Container Build') {
      steps {
        sh '''
          set -eu
          docker build --pull --no-cache --platform linux/amd64 --file Dockerfile --tag it-your-it-house:local .
          docker build --pull --no-cache --platform linux/amd64 --file backend/Dockerfile --tag it-your-it-house-backend:local backend
        '''
      }
    }

    stage('Container Security') {
      steps {
        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE', message: 'Trivy image scanning failed or crossed the configured severity threshold.') {
          sh '''
            set -eu
            trivy="$TRIVY_HOME/trivy"
            test -x "$trivy" || { echo 'Pinned Trivy installation is unavailable.' >&2; exit 2; }
            mkdir -p reports/trivy

            for image in it-your-it-house:local it-your-it-house-backend:local; do
              name="${image%%:*}"
              if "$trivy" image --quiet --scanners vuln --severity "$TRIVY_IMAGE_FAIL_ON_SEVERITY" --exit-code 1 \
                --format json --output "reports/trivy/${name}-vulnerabilities.json" "$image"; then
                :
              else
                scan_failed=1
              fi
              test -s "reports/trivy/${name}-vulnerabilities.json"
              jq -r '
                .Results[]? | .Vulnerabilities[]? |
                [.Severity, .VulnerabilityID, .PkgName, .InstalledVersion, (.FixedVersion // "no known fix")] | @tsv
              ' "reports/trivy/${name}-vulnerabilities.json" > "reports/trivy/${name}-vulnerabilities.txt"
              "$trivy" image --quiet --format cyclonedx \
                --output "reports/trivy/${name}-sbom.cdx.json" "$image"
              count="$(jq \
                '[.Results[]? | .Vulnerabilities[]? |
                  select(.Severity == "CRITICAL")] | length' \
                "reports/trivy/${name}-vulnerabilities.json")"
              printf 'CRITICAL findings for %s: %s\\n' "$image" "$count"
              if [ "$count" -gt 0 ]; then
                scan_failed=1
              fi
            done

            if [ "${scan_failed:-0}" -ne 0 ]; then
              exit 1
            fi
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'reports/trivy/**', allowEmptyArchive: true
        }
      }
    }

    stage('AWS Authentication') {
      when {
        allOf {
          expression { isMainBranchBuild() }
          expression { params.DEPLOY_TO_AWS }
          expression { currentBuild.currentResult == 'SUCCESS' }
        }
      }
      steps {
        script {
          env.AWS_ACCOUNT_ID = sh(
            script: 'aws sts get-caller-identity --query Account --output text',
            returnStdout: true
          ).trim()
          if (!env.AWS_ACCOUNT_ID.matches('[0-9]{12}')) {
            error('AWS caller identity did not return a 12-digit account ID.')
          }
          def callerArn = sh(
            script: 'aws sts get-caller-identity --query Arn --output text',
            returnStdout: true
          ).trim()
          if (!callerArn.matches('arn:[^:]+:sts::[0-9]{12}:assumed-role/.+/.+')) {
            error('AWS deployment requires the Jenkins EC2 instance-profile assumed-role identity.')
          }
          env.TF_VAR_jenkins_role_arn = callerArn.replaceFirst(
            'arn:([^:]+):sts::([0-9]{12}):assumed-role/(.+)/[^/]+$',
            'arn:$1:iam::$2:role/$3'
          )
          if (!env.TF_VAR_jenkins_role_arn.matches("arn:aws:iam::${env.AWS_ACCOUNT_ID}:role/.+")) {
            error('Could not derive the Jenkins IAM role ARN from the assumed-role identity.')
          }
          if (!params.KUBERNETES_OPERATOR_PRINCIPAL_ARN.matches("arn:aws:iam::${env.AWS_ACCOUNT_ID}:(role|user)/.+")) {
            error('KUBERNETES_OPERATOR_PRINCIPAL_ARN must be an IAM user or role ARN in the deployment account.')
          }
          if (params.KUBERNETES_OPERATOR_PRINCIPAL_ARN == env.TF_VAR_jenkins_role_arn) {
            error('KUBERNETES_OPERATOR_PRINCIPAL_ARN must be distinct from the Jenkins deployment role.')
          }
          if (!params.KUBERNETES_VERSION.matches('1\\.(2[8-9]|[3-9][0-9])')) {
            error('KUBERNETES_VERSION must be EKS 1.28 or newer for default Kubernetes API data encryption.')
          }

          def clientCidrs = params.KUBERNETES_API_ACCESS_CIDRS
            .split(',')
            .collect { it.trim() }
            .findAll { it }
          if (clientCidrs.isEmpty() ||
              clientCidrs.any { !it.matches('(?:[0-9]{1,3}\\.){3}[0-9]{1,3}/(?:[1-9]|[12][0-9]|3[0-2])') }) {
            error('KUBERNETES_API_ACCESS_CIDRS must contain explicit IPv4 CIDRs with prefixes /1 through /32; /0 is not allowed.')
          }
          def jenkinsEgressIp = sh(
            script: 'curl --fail --silent --show-error --ipv4 https://checkip.amazonaws.com',
            returnStdout: true
          ).trim()
          if (!jenkinsEgressIp.matches('(?:[0-9]{1,3}\\.){3}[0-9]{1,3}')) {
            error('Could not determine the Jenkins agent public egress IPv4 address.')
          }
          clientCidrs.add("${jenkinsEgressIp}/32")
          env.TF_VAR_kubernetes_api_access_cidrs = groovy.json.JsonOutput.toJson(clientCidrs.unique())
          env.TF_VAR_kubernetes_operator_principal_arn = params.KUBERNETES_OPERATOR_PRINCIPAL_ARN
          env.TF_VAR_kubernetes_version = params.KUBERNETES_VERSION
        }
        sh '''
          set -eu
          for template in cloudformation/*.yaml; do
            aws cloudformation validate-template \
              --template-body "file://$WORKSPACE/$template" \
              --region "$AWS_REGION" >/dev/null
          done
        '''
        echo "AWS identity and restricted EKS API access validated for account ${env.AWS_ACCOUNT_ID} in ${env.AWS_REGION}."
      }
    }

    stage('Registry Infrastructure') {
      when {
        allOf {
          expression { isMainBranchBuild() }
          expression { params.DEPLOY_TO_AWS }
          expression { currentBuild.currentResult == 'SUCCESS' }
        }
      }
      steps {
        sh 'ansible-playbook -i localhost, ansible/playbooks/terraform-workflow.yml -e terraform_operation=plan'
        archiveArtifacts artifacts: 'reports/terraform-plan.txt', fingerprint: true
        input message: 'Review the Terraform plan, including any deletion of the obsolete AMP/AMG monitoring stack, before approving registry infrastructure changes.', ok: 'Approve infrastructure plan'
        sh 'ansible-playbook -i localhost, ansible/playbooks/terraform-workflow.yml -e terraform_operation=apply -e approved_cloudformation_change=true'
      }
    }

    stage('ECR Publish') {
      when {
        allOf {
          expression { isMainBranchBuild() }
          expression { params.DEPLOY_TO_AWS }
          expression { currentBuild.currentResult == 'SUCCESS' }
        }
      }
      steps {
        script {
          env.FRONTEND_REPOSITORY_URI = sh(
            script: 'terraform -chdir=terraform output -raw frontend_repository_uri',
            returnStdout: true
          ).trim()
          env.BACKEND_REPOSITORY_URI = sh(
            script: 'terraform -chdir=terraform output -raw backend_repository_uri',
            returnStdout: true
          ).trim()
          env.RELEASE_TAG = "build-${env.BUILD_NUMBER}-sha-${env.GIT_COMMIT}"
        }
        sh(script: '''#!/usr/bin/env bash
          set -euo pipefail
          registry="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
          docker_config="${WORKSPACE}@tmp/docker-${BUILD_NUMBER}"
          install -d -m 700 "$docker_config"
          export DOCKER_CONFIG="$docker_config"
          trap 'rm -rf -- "$docker_config"' EXIT

          aws ecr get-login-password --region "$AWS_REGION" \
            | docker login --username AWS --password-stdin "$registry"
          docker tag it-your-it-house:local "$FRONTEND_REPOSITORY_URI:$RELEASE_TAG"
          docker tag it-your-it-house-backend:local "$BACKEND_REPOSITORY_URI:$RELEASE_TAG"
          docker push "$FRONTEND_REPOSITORY_URI:$RELEASE_TAG"
          docker push "$BACKEND_REPOSITORY_URI:$RELEASE_TAG"
          docker logout "$registry" >/dev/null
          rm -rf -- "$docker_config"
          trap - EXIT
        ''')
        script {
          def frontendDigest = sh(
            script: "aws ecr describe-images --repository-name '${env.APP_NAME}-frontend' --image-ids imageTag='${env.RELEASE_TAG}' --query 'imageDetails[0].imageDigest' --output text",
            returnStdout: true
          ).trim()
          def backendDigest = sh(
            script: "aws ecr describe-images --repository-name '${env.APP_NAME}-backend' --image-ids imageTag='${env.RELEASE_TAG}' --query 'imageDetails[0].imageDigest' --output text",
            returnStdout: true
          ).trim()
          if (!frontendDigest.matches('sha256:[0-9a-f]{64}') ||
              !backendDigest.matches('sha256:[0-9a-f]{64}')) {
            error('ECR did not return valid image digests; deployment is blocked.')
          }
          env.FRONTEND_IMAGE_URI = "${env.FRONTEND_REPOSITORY_URI}@${frontendDigest}"
          env.BACKEND_IMAGE_URI = "${env.BACKEND_REPOSITORY_URI}@${backendDigest}"
        }
      }
    }

    stage('Deploy to EKS') {
      when {
        allOf {
          expression { isMainBranchBuild() }
          expression { params.DEPLOY_TO_AWS }
          expression { currentBuild.currentResult == 'SUCCESS' }
        }
      }
      steps {
        withEnv(['TF_VAR_deploy_application=true']) {
          sh 'ansible-playbook -i localhost, ansible/playbooks/terraform-workflow.yml -e terraform_operation=plan -e require_application_deployment=true'
        }
        archiveArtifacts artifacts: 'reports/terraform-plan.txt', fingerprint: true
        input message: 'Review and approve the EKS cluster, worker nodes, network, database, and IAM CloudFormation plan.', ok: 'Approve EKS infrastructure'
        withEnv(['TF_VAR_deploy_application=true']) {
          sh 'ansible-playbook -i localhost, ansible/playbooks/terraform-workflow.yml -e terraform_operation=apply -e approved_cloudformation_change=true -e require_application_deployment=true'
        }
        script {
          env.EKS_CLUSTER_NAME = sh(
            script: "terraform -chdir=terraform output -json | jq -er '.application_outputs.value.ClusterName'",
            returnStdout: true
          ).trim()
          env.K8S_APP_NAMESPACE = sh(
            script: "terraform -chdir=terraform output -json | jq -er '.application_outputs.value.ApplicationNamespace'",
            returnStdout: true
          ).trim()
          env.DB_HOST = sh(
            script: "terraform -chdir=terraform output -json | jq -er '.application_outputs.value.DatabaseEndpoint'",
            returnStdout: true
          ).trim()
          env.DB_SECRET_ARN = sh(
            script: "terraform -chdir=terraform output -json | jq -er '.application_outputs.value.DatabaseSecretArn'",
            returnStdout: true
          ).trim()
          env.METRICS_SECRET_ARN = sh(
            script: "terraform -chdir=terraform output -json | jq -er '.application_outputs.value.MetricsSecretArn'",
            returnStdout: true
          ).trim()
          env.GRAFANA_SECRET_ARN = sh(
            script: "terraform -chdir=terraform output -json | jq -er '.application_outputs.value.GrafanaSecretArn'",
            returnStdout: true
          ).trim()
          env.KUBECONFIG = "${env.WORKSPACE}@tmp/kubeconfig-${env.BUILD_NUMBER}"
        }
        sh '''#!/usr/bin/env bash
          set -euo pipefail
          umask 077
          aws eks wait cluster-active --name "$EKS_CLUSTER_NAME" --region "$AWS_REGION"
          aws eks update-kubeconfig \
            --name "$EKS_CLUSTER_NAME" \
            --region "$AWS_REGION" \
            --kubeconfig "$KUBECONFIG"
          kubectl wait --for=condition=Ready nodes --all --timeout=20m
          kubectl apply --filename k8s/namespace.yaml
          kubectl create namespace monitoring --dry-run=client --output yaml | kubectl apply --filename -

          kubectl create configmap backend-config \
            --namespace "$K8S_APP_NAMESPACE" \
            --from-literal="DB_HOST=$DB_HOST" \
            --from-literal=DB_PORT=5432 \
            --from-literal=DB_NAME=it_your_it_house \
            --from-literal=DB_USER=app_user \
            --dry-run=client --output yaml | kubectl apply --filename -

          aws secretsmanager get-secret-value \
            --secret-id "$DB_SECRET_ARN" \
            --query SecretString --output text \
            | node scripts/render-k8s-secret.mjs database-credentials password password \
            | kubectl apply --filename -
          aws secretsmanager get-secret-value \
            --secret-id "$METRICS_SECRET_ARN" \
            --query SecretString --output text \
            | node scripts/render-k8s-secret.mjs backend-metrics token \
            | kubectl apply --filename -
          aws secretsmanager get-secret-value \
            --secret-id "$GRAFANA_SECRET_ARN" \
            --query SecretString --output text \
            | node scripts/render-k8s-secret.mjs grafana-admin admin-password "" monitoring admin-user=admin \
            | kubectl apply --filename -

          helm repo add prometheus-community https://prometheus-community.github.io/helm-charts --force-update
          helm repo update prometheus-community
          helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
            --version 92.10.1 \
            --namespace monitoring \
            --values k8s/monitoring-values.yaml \
            --wait --timeout 15m

          kubectl create configmap it-your-it-house-dashboard \
            --namespace monitoring \
            --from-file=it-your-it-house.json=monitoring/grafana/provisioning/dashboards/it-your-it-house.json \
            --dry-run=client --output yaml \
            | kubectl label --local --filename - grafana_dashboard=1 --overwrite --output yaml \
            | kubectl apply --filename -
          kubectl rollout status deployment/monitoring-grafana --namespace monitoring --timeout=10m
        '''
        input message: 'Review and approve the Prisma migration against the new private PostgreSQL database.', ok: 'Approve database migration'
        sh '''#!/usr/bin/env bash
          set -euo pipefail
          node scripts/render-k8s-manifest.mjs k8s/prisma-migration.yaml.tpl \
            | kubectl apply --filename -
          if ! kubectl wait \
            --for=condition=complete \
            "job/prisma-migration-$BUILD_NUMBER" \
            --namespace "$K8S_APP_NAMESPACE" \
            --timeout=30m; then
            echo 'Prisma migration job did not complete successfully; inspect restricted Kubernetes job logs.'
            exit 1
          fi
          kubectl get "job/prisma-migration-$BUILD_NUMBER" \
            --namespace "$K8S_APP_NAMESPACE" \
            --output json \
            | jq -e '.status.succeeded == 1' >/dev/null
        '''
        sh '''#!/usr/bin/env bash
          set -euo pipefail
          node scripts/render-k8s-manifest.mjs k8s/application.yaml.tpl \
            | kubectl apply --filename -
          kubectl rollout status deployment/frontend --namespace "$K8S_APP_NAMESPACE" --timeout=10m
          kubectl rollout status deployment/backend --namespace "$K8S_APP_NAMESPACE" --timeout=10m
          for deployment in frontend backend; do
            kubectl get pods --namespace "$K8S_APP_NAMESPACE" --selector "app=$deployment" --output json \
              | jq -e '.items | length > 0 and all(.[]; .status.phase == "Running" and ([.status.containerStatuses[]? | select(.ready == true)] | length == (.status.containerStatuses | length)))' >/dev/null
          done
          kubectl exec --namespace "$K8S_APP_NAMESPACE" deployment/frontend -- \
            node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
          kubectl exec --namespace "$K8S_APP_NAMESPACE" deployment/backend -- \
            node -e "fetch('http://127.0.0.1:4000/auth/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

          kubectl port-forward --namespace monitoring \
            service/monitoring-kube-prometheus-prometheus 19090:9090 \
            > "$KUBECONFIG.prometheus.log" 2>&1 &
          port_forward_pid=$!
          trap 'kill "$port_forward_pid" 2>/dev/null || true; rm -f "$KUBECONFIG.prometheus.log"' EXIT
          attempt=0
          until curl --fail --silent http://127.0.0.1:19090/-/ready >/dev/null; do
            attempt=$((attempt + 1))
            if [ "$attempt" -ge 30 ]; then
              echo 'Prometheus did not become ready for the deployment check.'
              exit 1
            fi
            sleep 2
          done
          curl --fail --silent --get \
            --data-urlencode "query=up{namespace=\\"$K8S_APP_NAMESPACE\\",service=\\"backend\\"}" \
            http://127.0.0.1:19090/api/v1/query \
            | jq -e '.status == "success" and (.data.result | length > 0) and any(.data.result[]; .value[1] == "1")' >/dev/null
          kubectl get pods --namespace "$K8S_APP_NAMESPACE" --output wide
          kubectl get pods --namespace monitoring --output wide
        '''
        echo "Deployment verified. To open the app, run kubectl port-forward -n ${env.K8S_APP_NAMESPACE} svc/frontend 3000:3000; then browse http://localhost:3000."
        echo 'Grafana is private: run kubectl port-forward -n monitoring svc/monitoring-grafana 3001:80, then open http://localhost:3001.'
        echo "Use the configured Kubernetes operator AWS identity and the approved CIDR allowlist to access EKS."
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'reports/trivy/**,reports/semgrep/**,reports/terraform-plan.txt', allowEmptyArchive: true
      sh 'rm -rf -- "$TRIVY_HOME"'
      sh 'if [ -n "${KUBECONFIG:-}" ]; then rm -f -- "$KUBECONFIG"; fi'
      echo 'Security reports are archived; review Jenkins access controls before sharing build artifacts.'
    }
    success {
      echo 'All configured CI checks completed. AWS stages run only for main builds with DEPLOY_TO_AWS enabled and manual approvals.'
    }
    failure {
      echo 'Pipeline failed. Review the failed stage and archived security reports before retrying.'
    }
  }
}
