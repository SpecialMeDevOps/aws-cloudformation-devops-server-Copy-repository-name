pipeline {
  agent any

  tools {
    nodejs 'NodeJS-22'
  }

  environment {
    NODE_ENV = 'test'
    APP_NAME = 'it-your-it-house'
    AWS_REGION = 'us-east-1'
  }

  options {
    timestamps()
    timeout(time: 60, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        echo "Checking out commit ${env.GIT_COMMIT ?: 'unknown'} on branch ${env.BRANCH_NAME ?: 'local'}"
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
      }
    }

    stage('SAST') {
      steps {
        echo 'Configure Semgrep or SonarQube here. This stage must fail or warn based on the agreed policy.'
      }
    }

    stage('Dependency Security') {
      steps {
        sh 'npm audit --audit-level=high || true'
      }
    }

    stage('Secret Scanning') {
      steps {
        echo 'Configure Gitleaks or equivalent repository secret scanning.'
      }
    }

    stage('Infrastructure Security') {
      steps {
        echo 'Run terraform fmt -check, terraform validate, tflint, cfn-lint, ansible-lint and syntax checks when those tools are available.'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
        sh 'cd backend && npm run build'
        sh 'docker build -t it-your-it-house:local .'
        sh 'docker build -t it-your-it-house-backend:local ./backend'
      }
    }

    stage('Container Security') {
      steps {
        echo 'Run Trivy or equivalent image scanning and publish machine-readable reports.'
      }
    }

    stage('AWS Authentication') {
      steps {
        echo 'Authenticate Jenkins to AWS using the least-privilege identity available, not long-lived static keys where possible.'
      }
    }

    stage('ECR Publish') {
      steps {
        echo 'Authenticate to Amazon ECR and push approved images with immutable digests.'
      }
    }

    stage('Deploy to ECS') {
      when {
        expression { env.BRANCH_NAME == 'main' }
      }
      steps {
        echo 'Deploy only after approval and health checks. Default target is ECS Fargate.'
      }
    }

    stage('Post-Deploy Verification') {
      steps {
        echo 'Validate frontend health, backend health, database connectivity, and deployment metadata.'
      }
    }
  }

  post {
    always {
      echo 'Collect build metadata, logs, and artifacts without leaking secrets.'
    }
    success {
      echo 'Pipeline completed successfully.'
    }
    failure {
      echo 'Pipeline failed. Review logs and security findings before retrying.'
    }
  }
}
