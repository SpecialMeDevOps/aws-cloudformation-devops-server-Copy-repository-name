apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: __APP_NAMESPACE__
  labels:
    app.kubernetes.io/name: frontend
spec:
  replicas: 1
  revisionHistoryLimit: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: __FRONTEND_IMAGE__
          imagePullPolicy: Always
          ports:
            - name: http
              containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"
            - name: HOSTNAME
              value: 0.0.0.0
            - name: BACKEND_URL
              value: http://backend:4000
          readinessProbe:
            httpGet:
              path: /api/health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /api/health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 20
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
            - name: next-cache
              mountPath: /app/.next/cache
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: next-cache
          emptyDir: {}
        - name: tmp
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: __APP_NAMESPACE__
  labels:
    app: frontend
spec:
  type: ClusterIP
  selector:
    app: frontend
  ports:
    - name: http
      port: 3000
      targetPort: http
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: __APP_NAMESPACE__
  labels:
    app.kubernetes.io/name: backend
spec:
  replicas: 1
  revisionHistoryLimit: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: __BACKEND_IMAGE__
          imagePullPolicy: Always
          ports:
            - name: http
              containerPort: 4000
          envFrom:
            - configMapRef:
                name: backend-config
          env:
            - name: NODE_ENV
              value: production
            - name: APP_PORT
              value: "4000"
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: database-credentials
                  key: password
            - name: METRICS_TOKEN
              valueFrom:
                secretKeyRef:
                  name: backend-metrics
                  key: token
          readinessProbe:
            httpGet:
              path: /auth/health
              port: http
            initialDelaySeconds: 20
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /auth/health
              port: http
            initialDelaySeconds: 60
            periodSeconds: 20
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
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: __APP_NAMESPACE__
  labels:
    app: backend
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
    - name: http
      port: 4000
      targetPort: http
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: backend
  namespace: __APP_NAMESPACE__
  labels:
    release: monitoring
spec:
  namespaceSelector:
    matchNames:
      - __APP_NAMESPACE__
  selector:
    matchLabels:
      app: backend
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
      authorization:
        credentials:
          name: backend-metrics
          key: token
