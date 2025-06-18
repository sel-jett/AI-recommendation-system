from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.metrics.pairwise import cosine_similarity
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class CourseRecommenderAPI:
    def __init__(self, courses_file="courses.csv"):
        print("Loading course data...")
        self.courses = pd.read_csv(courses_file)
        self.courses['course_id'] = self.courses['course_id'].astype(str)
        print(f"Loaded {len(self.courses)} courses")
        
        self.initialize_system()
    
    def initialize_system(self):
        print("Initializing recommendation system...")
        self.create_user_interactions()
        self.build_and_train_model()
        self.generate_embeddings()
        print("Recommendation system initialized!")
    
    def create_user_interactions(self):
        num_users = 1000
        print(f"Simulating {num_users} users and their course interactions...")
        
        user_ids = [f"user_{i}" for i in range(num_users)]
        
        np.random.seed(42)
        interactions = []
        
        subjects = self.courses['subject'].unique()
        
        for user_id in user_ids:
            num_preferred_subjects = np.random.randint(1, 3)
            preferred_subjects = np.random.choice(subjects, size=num_preferred_subjects, replace=False)
            
            for subject in preferred_subjects:
                subject_courses = self.courses[self.courses['subject'] == subject]
                if len(subject_courses) > 0:
                    num_courses = min(3, len(subject_courses))
                    selected_courses = subject_courses.sample(n=num_courses)
                    
                    for _, course in selected_courses.iterrows():
                        rating = np.random.uniform(3, 5)
                        interactions.append({
                            'user_id': user_id,
                            'course_id': str(course['course_id']),
                            'rating': rating,
                            'subject': course['subject'],
                            'level': course['level']
                        })
        
        self.ratings = pd.DataFrame(interactions)
        print(f"Generated {len(self.ratings)} user-course interactions")
        self.unique_user_ids = self.ratings['user_id'].unique()
        self.unique_course_ids = self.courses['course_id'].unique()
    
    def build_and_train_model(self):
        print("Building and training the recommendation model...")
        
        embedding_dimension = 32
        self.user_ids_vocabulary = tf.keras.layers.StringLookup(mask_token=None)
        self.user_ids_vocabulary.adapt(tf.data.Dataset.from_tensor_slices(self.unique_user_ids))
        self.course_ids_vocabulary = tf.keras.layers.StringLookup(mask_token=None)
        self.course_ids_vocabulary.adapt(tf.data.Dataset.from_tensor_slices(self.ratings['course_id'].unique()))
        
        self.user_model = tf.keras.Sequential([
            self.user_ids_vocabulary,
            tf.keras.layers.Embedding(self.user_ids_vocabulary.vocabulary_size(), embedding_dimension)
        ])
        
        self.course_model = tf.keras.Sequential([
            self.course_ids_vocabulary,
            tf.keras.layers.Embedding(self.course_ids_vocabulary.vocabulary_size(), embedding_dimension)
        ])
        
        class RecommenderModel(tf.keras.Model):
            def __init__(self, user_model, course_model):
                super().__init__()
                self.user_model = user_model
                self.course_model = course_model
                self.rating_model = tf.keras.Sequential([
                    tf.keras.layers.Dense(8, activation="relu"),
                    tf.keras.layers.Dense(1)
                ])
                
            def call(self, inputs):
                user_id, course_id = inputs
                user_embedding = self.user_model(user_id)
                course_embedding = self.course_model(course_id)
                concatenated = tf.concat([user_embedding, course_embedding], axis=1)
                return self.rating_model(concatenated)
        
        self.model = RecommenderModel(self.user_model, self.course_model)
        self.model.compile(
            loss=tf.keras.losses.MeanSquaredError(),
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001)
        )
        
        def make_dataset(ratings_data, batch_size=256, shuffle=True):
            user_ids_tensor = tf.convert_to_tensor(ratings_data['user_id'].values)
            course_ids_tensor = tf.convert_to_tensor(ratings_data['course_id'].values)
            ratings_tensor = tf.convert_to_tensor(ratings_data['rating'].values, dtype=tf.float32)
            dataset = tf.data.Dataset.from_tensor_slices((
                (user_ids_tensor, course_ids_tensor),
                ratings_tensor
            ))
            if shuffle:
                dataset = dataset.shuffle(buffer_size=len(ratings_data))
            
            dataset = dataset.batch(batch_size)
            return dataset
        
        train_dataset = make_dataset(self.ratings)
        self.model.fit(train_dataset, epochs=5, verbose=0)
        print("Model training complete")
    
    def generate_embeddings(self):
        print("Generating embeddings...")
        
        self.user_embeddings = {}
        for user_id in self.unique_user_ids:
            user_embedding = self.user_model(tf.constant([user_id])).numpy()[0]
            self.user_embeddings[user_id] = user_embedding
        
        self.course_embeddings = {}
        for course_id in self.unique_course_ids:
            if course_id in self.ratings['course_id'].values:
                course_embedding = self.course_model(tf.constant([course_id])).numpy()[0]
                self.course_embeddings[course_id] = course_embedding
        
        print(f"Generated embeddings for {len(self.user_embeddings)} users and {len(self.course_embeddings)} courses")
    
    def recommend_courses_to_user(self, user_id, top_k=5):
        if user_id not in self.user_embeddings:
            print(f"User {user_id} not found in embeddings")
            return pd.DataFrame()
        
        user_embedding = self.user_embeddings[user_id]
        similarities = []
        
        for course_id, course_embedding in self.course_embeddings.items():
            similarity = np.dot(user_embedding, course_embedding)
            similarities.append((course_id, similarity))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        top_course_ids = [sim[0] for sim in similarities[:top_k]]
        
        return self.courses[self.courses['course_id'].isin(top_course_ids)][
            ['course_id', 'course_title', 'subject', 'level', 'price', 'num_subscribers', 'num_reviews', 'num_lectures', 'content_duration']
        ]

# Initialize the recommender system
recommender = CourseRecommenderAPI()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Course Recommender API is running"})

@app.route('/recommend', methods=['POST'])
def get_recommendations():
    try:
        data = request.get_json()
        user_id = data.get('userId', 'user_0')
        top_k = data.get('topK', 10)
        
        recommendations = recommender.recommend_courses_to_user(user_id, top_k)
        
        if recommendations.empty:
            return jsonify({
                "recommendations": [],
                "message": f"No recommendations found for user {user_id}"
            })
        
        # Convert to list of dictionaries
        recommendations_list = recommendations.to_dict('records')
        
        return jsonify({
            "recommendations": recommendations_list,
            "userId": user_id,
            "topK": top_k
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/courses', methods=['GET'])
def get_courses():
    try:
        courses_list = recommender.courses.to_dict('records')
        return jsonify({"courses": courses_list})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/courses/<course_id>', methods=['GET'])
def get_course(course_id):
    try:
        course = recommender.courses[recommender.courses['course_id'] == course_id]
        if course.empty:
            return jsonify({"error": "Course not found"}), 404
        
        course_dict = course.iloc[0].to_dict()
        return jsonify({"course": course_dict})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/users', methods=['GET'])
def get_users():
    try:
        users = list(recommender.unique_user_ids)
        return jsonify({"users": users})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Course Recommender API Server...")
    print("API will be available at http://localhost:5000")
    print("Available endpoints:")
    print("  GET  /health - Health check")
    print("  POST /recommend - Get recommendations for a user")
    print("  GET  /courses - Get all courses")
    print("  GET  /courses/<id> - Get specific course")
    print("  GET  /users - Get all users")
    app.run(debug=True, host='0.0.0.0', port=5000) 