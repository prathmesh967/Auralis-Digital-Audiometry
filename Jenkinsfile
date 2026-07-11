pipeline {
    agent any

    tools {
        nodejs 'Node22'
    }

    stages {

        stage('Install Frontend') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                }
            }
        }

        stage('Install Backend') {
            steps {
                dir('backend') {
                    bat 'npm ci'
                }
            }
        }

        stage('Create Environment File') {
            steps {
                bat 'if exist backend\\.env del backend\\.env'

                withCredentials([
                    string(credentialsId: 'MONGODB_URI', variable: 'MONGO_URI'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT')
                ]) {
                    writeFile file: 'backend/.env', text: """
MONGODB_URI=${MONGO_URI}
JWT_SECRET=${JWT}
PORT=4000
"""
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