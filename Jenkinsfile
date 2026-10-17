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
      description: 'Enable the approved AWS infrastructure, ECR, ECS, and monitoring workflow on main.'
    )
  }

  tools {
    nodejs 'NodeJS-22'
  }

  environment {
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
    TF_VAR_service_desired_count = '1'
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
            config_count="$(threshold_count reports/trivy/infrastructure-misconfigurations.json)"
            secret_count="$(jq --arg threshold "$TRIVY_FAIL_ON_SEVERITY" \
              '[.Results[]? | .Secrets[]? |
                select(.Severity as $severity | ($threshold | split(",")) | index($severity))] | length' \
              "$TRIVY_HOME/secrets-private.json")"
            rm -f -- "$TRIVY_HOME/secrets-private.json"

            printf 'Threshold %s: filesystem=%s config=%s secrets=%s\\n' \
              "$TRIVY_FAIL_ON_SEVERITY" "$vulnerability_count" "$config_count" "$secret_count"
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
          docker build --pull --no-cache --file Dockerfile --tag it-your-it-house:local .
          docker build --pull --no-cache --file backend/Dockerfile --tag it-your-it-house-backend:local backend
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
              if "$trivy" image --quiet --scanners vuln --severity HIGH,CRITICAL --exit-code 1 \
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
                  select(.Severity == "HIGH" or .Severity == "CRITICAL")] | length' \
                "reports/trivy/${name}-vulnerabilities.json")"
              printf 'HIGH,CRITICAL findings for %s: %s\\n' "$image" "$count"
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
          if (!(env.AWS_ACCOUNT_ID ==~ /[0-9]{12}/)) {
            error('AWS caller identity did not return a 12-digit account ID.')
          }
          def callerArn = sh(
            script: 'aws sts get-caller-identity --query Arn --output text',
            returnStdout: true
          ).trim()
          if (!(callerArn ==~ /^arn:[^:]+:sts::[0-9]{12}:assumed-role\/([A-Za-z0-9+=,.@_-]{1,64})\/[^\/]+$/)) {
            error('AWS deployment requires the Jenkins EC2 instance-profile assumed-role identity.')
          }
          env.TF_VAR_monitoring_instance_role_name = callerArn.split('/')[1]
          env.TF_VAR_s3_managed_prefix_list_id = sh(
            script: "aws ec2 describe-managed-prefix-lists --filters Name=prefix-list-name,Values=com.amazonaws.${env.AWS_REGION}.s3 --query 'PrefixLists[0].PrefixListId' --output text",
            returnStdout: true
          ).trim()
          if (!(env.TF_VAR_s3_managed_prefix_list_id ==~ /pl-[0-9a-f]+/)) {
            error('AWS did not return the regional managed S3 prefix list ID.')
          }
          env.TF_VAR_cloudfront_origin_prefix_list_id = sh(
            script: "aws ec2 describe-managed-prefix-lists --filters Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing --query 'PrefixLists[0].PrefixListId' --output text",
            returnStdout: true
          ).trim()
          if (!(env.TF_VAR_cloudfront_origin_prefix_list_id ==~ /pl-[0-9a-f]+/)) {
            error('AWS did not return the managed CloudFront origin-facing prefix list ID.')
          }
        }
        sh '''
          set -eu
          for template in cloudformation/*.yaml; do
            aws cloudformation validate-template \
              --template-body "file://$WORKSPACE/$template" \
              --region "$AWS_REGION" >/dev/null
          done
        '''
        echo "AWS identity validated for account ${env.AWS_ACCOUNT_ID} in ${env.AWS_REGION}."
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
        input message: 'Review the Terraform plan and approve creating or updating the CloudFormation-owned ECR registry stack.', ok: 'Approve registry stack'
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
          env.RELEASE_TAG = "sha-${env.GIT_COMMIT}"
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
          env.TF_VAR_frontend_image_uri = sh(
            script: "aws ecr describe-images --repository-name '${env.APP_NAME}-frontend' --image-ids imageTag='${env.RELEASE_TAG}' --query 'imageDetails[0].imageDigest' --output text",
            returnStdout: true
          ).trim()
          env.TF_VAR_backend_image_uri = sh(
            script: "aws ecr describe-images --repository-name '${env.APP_NAME}-backend' --image-ids imageTag='${env.RELEASE_TAG}' --query 'imageDetails[0].imageDigest' --output text",
            returnStdout: true
          ).trim()
          if (!(env.TF_VAR_frontend_image_uri ==~ /sha256:[0-9a-f]{64}/) ||
              !(env.TF_VAR_backend_image_uri ==~ /sha256:[0-9a-f]{64}/)) {
            error('ECR did not return valid image digests; deployment is blocked.')
          }
          env.TF_VAR_frontend_image_uri = "${env.FRONTEND_REPOSITORY_URI}@${env.TF_VAR_frontend_image_uri}"
          env.TF_VAR_backend_image_uri = "${env.BACKEND_REPOSITORY_URI}@${env.TF_VAR_backend_image_uri}"
        }
      }
    }

    stage('Deploy to ECS') {
      when {
        allOf {
          expression { isMainBranchBuild() }
          expression { params.DEPLOY_TO_AWS }
          expression { currentBuild.currentResult == 'SUCCESS' }
        }
      }
      steps {
        withEnv(['TF_VAR_deploy_application=true', 'TF_VAR_service_desired_count=0']) {
          sh 'ansible-playbook -i localhost, ansible/playbooks/terraform-workflow.yml -e terraform_operation=plan -e require_application_deployment=true'
        }
        archiveArtifacts artifacts: 'reports/terraform-plan.txt', fingerprint: true
        input message: 'Review and approve the application, database, network, and monitoring CloudFormation plan.', ok: 'Approve AWS deployment'
        withEnv(['TF_VAR_deploy_application=true', 'TF_VAR_service_desired_count=0']) {
          sh 'ansible-playbook -i localhost, ansible/playbooks/terraform-workflow.yml -e terraform_operation=apply -e approved_cloudformation_change=true -e require_application_deployment=true'
        }
        script {
          env.APPLICATION_URL = sh(
            script: "terraform -chdir=terraform output -json | jq -r '.application_outputs.value.ApplicationUrl'",
            returnStdout: true
          ).trim()
          if (!env.APPLICATION_URL || env.APPLICATION_URL == 'null') {
            error('Terraform did not return the CloudFront HTTPS application URL.')
          }
          echo "CloudFront HTTPS demo URL: ${env.APPLICATION_URL}"
        }
        input message: "Review the CloudFront HTTPS demo endpoint and approve the reviewed Prisma migration.", ok: 'Approve database migration'
        sh 'ansible-playbook -i localhost, ansible/playbooks/run-database-migrations.yml -e approved_database_migration=true'
        withEnv(['TF_VAR_deploy_application=true', 'TF_VAR_service_desired_count=1']) {
          sh 'ansible-playbook -i localhost, ansible/playbooks/terraform-workflow.yml -e terraform_operation=plan -e require_application_deployment=true'
        }
        archiveArtifacts artifacts: 'reports/terraform-plan.txt', fingerprint: true
        input message: 'Approve enabling ECS traffic only after the Prisma migration task succeeded.', ok: 'Approve ECS services'
        withEnv(['TF_VAR_deploy_application=true', 'TF_VAR_service_desired_count=1']) {
          sh 'ansible-playbook -i localhost, ansible/playbooks/terraform-workflow.yml -e terraform_operation=apply -e approved_cloudformation_change=true -e require_application_deployment=true'
        }
        sh 'ansible-playbook -i localhost, ansible/playbooks/verify-application.yml'
      }
    }

    stage('Monitoring Verification') {
      when {
        allOf {
          expression { isMainBranchBuild() }
          expression { params.DEPLOY_TO_AWS }
          expression { currentBuild.currentResult == 'SUCCESS' }
        }
      }
      steps {
        input message: 'Confirm IAM Identity Center users are assigned to AMG and the grafana-api-token Jenkins credential is ready.', ok: 'Provision Grafana'
        withCredentials([string(credentialsId: 'grafana-api-token', variable: 'GRAFANA_API_TOKEN')]) {
          sh 'ansible-playbook -i localhost, ansible/playbooks/provision-monitoring.yml'
        }
        script {
          env.GRAFANA_ENDPOINT = sh(
            script: 'terraform -chdir=terraform output -json | jq -r \'.monitoring_outputs.value.GrafanaWorkspaceEndpoint\'',
            returnStdout: true
          ).trim()
        }
        echo "Grafana workspace: https://${env.GRAFANA_ENDPOINT}"
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'reports/trivy/**,reports/semgrep/**,reports/terraform-plan.txt', allowEmptyArchive: true
      sh 'rm -rf -- "$TRIVY_HOME"'
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
