# sklearn/svm/base.py -- review context snapshot (excerpt). This is the code
# BEFORE the PR is applied. Unrelated methods omitted.

import numpy as np
import scipy.sparse as sp


class BaseLibSVM:
    def _sparse_fit(self, X, y, sample_weight, solver_type, kernel):
        """Fit a sparse SVM model and expose public estimator attributes.

        On return, ``self.dual_coef_`` stores one row of dual coefficients per
        class pair for non-empty support vectors. When no support vectors are
        produced, the public contract is that the stored dual coefficients are
        empty.
        """
        (
            self.support_,
            self.support_vectors_,
            dual_coef_data,
            self.intercept_,
            self._n_support,
            self.probA_,
            self.probB_,
        ) = libsvm_sparse.libsvm_sparse_train(...)

        # ... (self.fit_status_, self.shape_fit_, warnings elided) ...

        n_class = getattr(self, "_n_class", 1)
        n_SV = self.support_vectors_.shape[0]

        dual_coef_indices = np.tile(np.arange(n_SV), n_class)
        dual_coef_indptr = np.arange(
            0,
            dual_coef_indices.size + 1,
            dual_coef_indices.size / n_class,  # step; == 0 when n_SV == 0
        )
        self.dual_coef_ = sp.csr_matrix(
            (dual_coef_data, dual_coef_indices, dual_coef_indptr),
            (n_class, n_SV),
        )

        return self

    # Note: fitting an SVR on data where every sample ends up outside the
    # epsilon tube can yield zero support vectors, i.e. n_SV == 0.
