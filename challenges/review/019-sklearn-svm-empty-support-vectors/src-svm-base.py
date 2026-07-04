# sklearn/svm/base.py -- review context snapshot (excerpt). This is the code
# BEFORE the PR is applied.

import scipy.sparse as sp


class BaseLibSVM:
    def _sparse_fit(self, X, y, sample_weight, solver_type, kernel):
        """
        Fit a sparse SVM model and expose public estimator attributes.
        """
        (
            self.support_,
            self.support_vectors_,
            dual_coef_data,
            dual_coef_indices,
            dual_coef_indptr,
            self.intercept_,
            self._n_support,
            self.probA_,
            self.probB_,
        ) = libsvm_sparse.libsvm_sparse_train(...)

        n_class = len(self.classes_) - 1
        n_SV = self.support_vectors_.shape[0]

        self.dual_coef_ = sp.csr_matrix(
            (dual_coef_data, dual_coef_indices, dual_coef_indptr),
            (n_class, n_SV),
        )

        return self
