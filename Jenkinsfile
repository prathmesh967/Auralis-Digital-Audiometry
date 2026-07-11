pipeline {
    agent any

    tools {
        nodejs 'Node22'
    }

    stages {

        stage('Install Frontend') {
            steps {
                dir('frontend') {
                    bat 'npm install'
                }
            }
        }

        stage('Install Backend') {
            steps {
                dir('backend') {
                    bat 'npm install'
                }
            }
        }

stage('Build Docker Images') {
    steps {
        bat 'docker compose build'
    }
}

stage('Deploy Containers') {
    steps {
        bat 'docker compose down'
        bat 'docker compose up -d'
    }
}

    post {
        success {
            echo 'Pipeline Successful'
        }

        failure {
            echo 'Pipeline Failed'
        }
    }
}