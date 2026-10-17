apiVersion: batch/v1
kind: Job
metadata:
  name: prisma-migration-__BUILD_NUMBER__
  namespace: __APP_NAMESPACE__
  labels:
    app.kubernetes.io/name: prisma-migration
spec:
  backoffLimit: 0
  ttlSecondsAfterFinished: 3600
  template:
    metadata:
      labels:
        app.kubernetes.io/name: prisma-migration
    spec:
      restartPolicy: Never
      containers:
        - name: migration
          image: __BACKEND_IMAGE__
          imagePullPolicy: Always
          command:
            - node
            - scripts/prisma-migrate-deploy.mjs
          envFrom:
            - configMapRef:
                name: backend-config
          env:
            - name: NODE_ENV
              value: production
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: database-credentials
                  key: password
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            runAsUser: 1000
            capabilities:
              drop: ["ALL"]
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
